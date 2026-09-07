import logging

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware # Added import
from app.routers import auth, users, roadmaps, dashboard, ai, roadmaps_enhanced, analytics, quizzes, projects, learning, career

from app.services import ai_learning
import app.models as models
from app.database import engine
from app.core.config import CORS_ORIGINS
from app.core.limiter import limiter # Import the shared limiter instance
from app.websockets import manager, ConnectionManager
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import redis.asyncio as redis
import os
import json

# Redis Config
REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")



app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation error: {exc.errors()}")
    logging.error(f"Request body: {exc.body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

# Set default limits on the imported limiter instance
limiter.default_limits = ["100/minute"]

app.add_middleware(SlowAPIMiddleware)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(roadmaps.router, prefix="/api/v1", tags=["Roadmaps"])
app.include_router(roadmaps_enhanced.router, prefix="/api/v1", tags=["Roadmaps Enhanced"])

app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])
app.include_router(ai.router, prefix="/api/v1", tags=["AI"])
app.include_router(ai_learning.router, prefix="/api/v1/ai-learning", tags=["AI Learning"])
app.include_router(quizzes.router, prefix="/api/v1", tags=["Quizzes"])
app.include_router(projects.router, prefix="/api/v1", tags=["Projects"])
app.include_router(learning.router, prefix="/api/v1/learning", tags=["Learning Intel"])
app.include_router(career.router, prefix="/api/v1/career", tags=["Career Exploration"])



@app.get("/")
def read_root():
    return {"message": "Welcome to the Career Guidance API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# WebSocket Endpoint
@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection open, wait for messages (ping/pong)
            # We don't really expect client messages, but we need to await something
            # to keep the socket alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Background Listener for Redis Events from Celery
async def redis_listener():
    r = redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe("grading_events")
    
    # Process messages
    async for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                user_id = data.get("user_id")
                if user_id:
                    # Route to specific user
                    print(f"🔔 Received event for user {user_id}, broadcasting...")
                    await manager.send_personal_message(data, user_id)
            except Exception as e:
                print(f"Error processing redis message: {e}")

@app.on_event("startup")
async def startup_event():
    # Start Redis listener in background
    asyncio.create_task(redis_listener())