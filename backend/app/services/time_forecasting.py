"""
Time Forecasting Service
Predicts completion timelines based on user's learning pace and historical data
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import app.models as models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def calculate_user_pace_multiplier(
    db: AsyncSession,
    user_id: int,
    min_samples: int = 3
) -> float:
    """
    Calculate the user's learning pace multiplier from historical data.
    
    Args:
        db: Database session
        user_id: ID of the user
        min_samples: Minimum number of completed tasks required
    
    Returns:
        Pace multiplier (actual_time / estimated_time)
    """
    result = await db.execute(
        select(func.avg(models.LearningPaceMetric.pace_multiplier))
        .filter(models.LearningPaceMetric.user_id == user_id)
    )
    
    avg_pace = result.scalar()
    
    # Check if we have enough samples
    count_result = await db.execute(
        select(func.count(models.LearningPaceMetric.id))
        .filter(models.LearningPaceMetric.user_id == user_id)
    )
    
    sample_count = count_result.scalar() or 0
    
    if sample_count < min_samples:
        logger.info(f"Insufficient samples ({sample_count}) for user {user_id}, using default pace 1.0")
        return 1.0  # Default to estimated time
    
    pace = avg_pace or 1.0
    logger.info(f"User {user_id} pace multiplier: {pace:.2f} (based on {sample_count} samples)")
    
    return pace


async def track_task_completion_time(
    db: AsyncSession,
    skill_id: int,
    user_id: int,
    time_spent_minutes: int
) -> None:
    """
    Track the completion time for a task and update learning pace metrics.
    
    Args:
        db: Database session
        skill_id: ID of the completed skill
        user_id: ID of the user
        time_spent_minutes: Actual time spent on the task
    """
    # Get the skill to find estimated time
    result = await db.execute(
        select(models.Skill).filter(models.Skill.id == skill_id)
    )
    
    skill = result.scalar_one_or_none()
    
    if not skill:
        logger.error(f"Skill {skill_id} not found")
        return
    
    estimated_minutes = skill.estimated_time_minutes or (skill.estimated_hours * 60)
    
    if estimated_minutes > 0:
        pace_multiplier = time_spent_minutes / estimated_minutes
        
        # Create learning pace metric
        metric = models.LearningPaceMetric(
            user_id=user_id,
            skill_id=skill_id,
            estimated_minutes=estimated_minutes,
            actual_minutes=time_spent_minutes,
            pace_multiplier=pace_multiplier
        )
        
        db.add(metric)
        
        # Update skill with actual time
        skill.actual_time_minutes = time_spent_minutes
        
        await db.commit()
        
        logger.info(f"Tracked completion: Skill {skill_id}, Estimated: {estimated_minutes}min, Actual: {time_spent_minutes}min, Pace: {pace_multiplier:.2f}x")


async def forecast_completion_timeline(
    db: AsyncSession,
    roadmap_id: int,
    user_id: int,
    weekly_hours: int = 10
) -> Dict:
    """
    Forecast when the user will complete the roadmap.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        user_id: ID of the user
        weekly_hours: Hours per week the user plans to study
    
    Returns:
        Dictionary with forecast data
    """
    # Get user's pace multiplier
    pace_multiplier = await calculate_user_pace_multiplier(db, user_id)
    
    # Get remaining tasks
    result = await db.execute(
        select(models.Skill)
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(
            models.Roadmap.id == roadmap_id,
            models.Skill.status != "completed"
        )
    )
    
    remaining_skills = result.scalars().all()
    
    if not remaining_skills:
        return {
            "projected_completion_date": None,
            "weekly_goal_minutes": 0,
            "pace_multiplier": pace_multiplier,
            "estimated_weeks_remaining": 0,
            "confidence_level": "high"
        }
    
    # Calculate total remaining time
    total_estimated_minutes = sum(
        skill.estimated_time_minutes or (skill.estimated_hours * 60)
        for skill in remaining_skills
    )
    
    # Adjust by user's pace
    adjusted_minutes = total_estimated_minutes * pace_multiplier
    
    # Convert to weeks
    weekly_minutes = weekly_hours * 60
    weeks_remaining = adjusted_minutes / weekly_minutes if weekly_minutes > 0 else 0
    
    # Calculate projected date
    projected_date = datetime.now() + timedelta(weeks=weeks_remaining)
    
    # Determine confidence level based on sample size
    sample_count_result = await db.execute(
        select(func.count(models.LearningPaceMetric.id))
        .filter(models.LearningPaceMetric.user_id == user_id)
    )
    
    sample_count = sample_count_result.scalar() or 0
    
    if sample_count >= 10:
        confidence = "high"
    elif sample_count >= 5:
        confidence = "medium"
    else:
        confidence = "low"
    
    logger.info(f"Forecast for roadmap {roadmap_id}: {weeks_remaining:.1f} weeks, completion: {projected_date.date()}")
    
    return {
        "projected_completion_date": projected_date.isoformat(),
        "weekly_goal_minutes": int(weekly_minutes),
        "pace_multiplier": round(pace_multiplier, 2),
        "estimated_weeks_remaining": round(weeks_remaining, 1),
        "confidence_level": confidence
    }


async def suggest_weekly_study_goal(
    db: AsyncSession,
    roadmap_id: int,
    user_id: int,
    target_weeks: int = 12
) -> int:
    """
    Suggest a weekly study goal to complete the roadmap in target weeks.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        user_id: ID of the user
        target_weeks: Target number of weeks to complete
    
    Returns:
        Suggested weekly study hours
    """
    pace_multiplier = await calculate_user_pace_multiplier(db, user_id)
    
    # Get remaining tasks
    result = await db.execute(
        select(models.Skill)
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(
            models.Roadmap.id == roadmap_id,
            models.Skill.status != "completed"
        )
    )
    
    remaining_skills = result.scalars().all()
    
    total_estimated_minutes = sum(
        skill.estimated_time_minutes or (skill.estimated_hours * 60)
        for skill in remaining_skills
    )
    
    # Adjust by user's pace
    adjusted_minutes = total_estimated_minutes * pace_multiplier
    
    # Calculate weekly hours needed
    weekly_minutes = adjusted_minutes / target_weeks if target_weeks > 0 else 0
    weekly_hours = int(weekly_minutes / 60)
    
    logger.info(f"Suggested weekly goal: {weekly_hours} hours to complete in {target_weeks} weeks")
    
    return weekly_hours
