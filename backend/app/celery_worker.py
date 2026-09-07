import os
from celery import Celery

# Get Redis URL from env or use default
# On Windows, user might be using a different setup, but localhost:6379 is standard
BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
BACKEND_URL = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

celery = Celery(
    "worker",
    broker=BROKER_URL,
    backend=BACKEND_URL,
    include=["app.tasks"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
