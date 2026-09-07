
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship

class LearningState(Base):
    """
    Derived state table. READ-ONLY with respect to Phase 1.
    Recalculated from Submissions and TaskCompletions.
    """
    __tablename__ = "learning_state"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    
    # Velocity Metrics
    avg_tasks_per_week = Column(Float, default=0.0)
    avg_time_to_pass_minutes = Column(Float, default=0.0) # Median or Avg
    retry_rate = Column(Float, default=0.0) # Fails per Pass
    
    # Mastery Metrics
    mastery_score = Column(Float, default=0.0) # 0.0 - 1.0
    mastery_level = Column(String, default="Beginner") # Beginner, Proficient, Expert
    quiz_average = Column(Float, default=0.0) # 0.0 - 100.0 (Normalized)
    project_average = Column(Float, default=0.0) # 0.0 - 100.0 (Normalized)
    
    # Adaptive Decisions
    next_recommended_task_id = Column(String, nullable=True) # e.g. "task_123" or "skill_5"
    
    # Activity
    last_active_at = Column(DateTime, nullable=True)
    
    # Intelligence Output
    current_velocity_band = Column(String, default="NORMAL") # STALLED, SLOW, NORMAL, FAST
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("app.models.User")
