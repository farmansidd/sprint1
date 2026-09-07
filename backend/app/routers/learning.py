
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User
from learning_state.models import LearningState
from intelligence.velocity.service import update_learning_state
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class LearningStateResponse(BaseModel):
    user_id: int
    avg_tasks_per_week: float
    avg_time_to_pass_minutes: float
    retry_rate: float
    current_velocity_band: str
    last_active_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

@router.get("/state", response_model=LearningStateResponse)
async def get_learning_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current learning state for the user.
    Triggers a recalculation to ensure fresh data (lite operation).
    """
    # Recalculate state on read to ensure it's up to date
    state = await update_learning_state(current_user.id, db)
    return state
