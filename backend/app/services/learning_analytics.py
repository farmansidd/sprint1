"""
Learning Analytics Service
Computes analytics for roadmap progress, completion rates, and bottleneck detection
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case
from sqlalchemy.orm import selectinload
import app.models as models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def calculate_weekly_completion_rate(
    db: AsyncSession,
    roadmap_id: int,
    weeks: int = 4
) -> float:
    """
    Calculate the weekly completion rate for a roadmap.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        weeks: Number of weeks to look back
    
    Returns:
        Average tasks completed per week
    """
    cutoff_date = datetime.now() - timedelta(weeks=weeks)
    
    # Get all skills for this roadmap
    result = await db.execute(
        select(models.Skill)
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(
            models.Roadmap.id == roadmap_id,
            models.Skill.status == "completed",
            models.Skill.completed_at >= cutoff_date
        )
    )
    
    completed_skills = result.scalars().all()
    completion_rate = len(completed_skills) / weeks if weeks > 0 else 0
    
    logger.info(f"Roadmap {roadmap_id}: {len(completed_skills)} tasks completed in {weeks} weeks (rate: {completion_rate:.2f}/week)")
    
    return completion_rate


async def detect_bottleneck_topics(
    db: AsyncSession,
    roadmap_id: int,
    threshold_multiplier: float = 1.5
) -> List[str]:
    """
    Detect topics where tasks are taking longer than estimated.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        threshold_multiplier: Multiplier for estimated time to consider a bottleneck
    
    Returns:
        List of topic names that are bottlenecks
    """
    # Get all topics with their skills
    result = await db.execute(
        select(models.Topic)
        .options(
            selectinload(models.Topic.subtopics).selectinload(models.Subtopic.skills)
        )
        .join(models.Roadmap)
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    topics = result.scalars().all()
    bottlenecks = []
    
    for topic in topics:
        total_estimated = 0
        total_actual = 0
        completed_count = 0
        
        for subtopic in topic.subtopics:
            for skill in subtopic.skills:
                if skill.status == "completed" and skill.actual_time_minutes:
                    estimated = skill.estimated_time_minutes or (skill.estimated_hours * 60)
                    total_estimated += estimated
                    total_actual += skill.actual_time_minutes
                    completed_count += 1
        
        if completed_count > 0 and total_estimated > 0:
            actual_vs_estimated = total_actual / total_estimated
            if actual_vs_estimated >= threshold_multiplier:
                bottlenecks.append(topic.name)
                logger.warning(f"Bottleneck detected in topic '{topic.name}': {actual_vs_estimated:.2f}x estimated time")
    
    return bottlenecks


async def generate_difficulty_heatmap(
    db: AsyncSession,
    roadmap_id: int
) -> Dict[str, Dict[str, int]]:
    """
    Generate a heatmap of task difficulties across topics.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
    
    Returns:
        Dictionary mapping topics to difficulty counts
    """
    result = await db.execute(
        select(models.Topic)
        .options(
            selectinload(models.Topic.subtopics).selectinload(models.Subtopic.skills)
        )
        .join(models.Roadmap)
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    topics = result.scalars().all()
    heatmap = {}
    
    for topic in topics:
        difficulty_counts = {"low": 0, "medium": 0, "high": 0}
        
        for subtopic in topic.subtopics:
            for skill in subtopic.skills:
                difficulty = skill.difficulty.lower() if skill.difficulty else "medium"
                if difficulty in difficulty_counts:
                    difficulty_counts[difficulty] += 1
        
        heatmap[topic.name] = difficulty_counts
    
    return heatmap


async def calculate_projected_completion_date(
    db: AsyncSession,
    roadmap_id: int,
    user_id: int,
    weekly_hours: int = 10
) -> Optional[str]:
    """
    Calculate the projected completion date based on user's pace.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        user_id: ID of the user
        weekly_hours: Hours per week the user plans to study
    
    Returns:
        Projected completion date as ISO string, or None if cannot calculate
    """
    # Get user's pace multiplier from historical data
    pace_result = await db.execute(
        select(func.avg(models.LearningPaceMetric.pace_multiplier))
        .filter(models.LearningPaceMetric.user_id == user_id)
    )
    
    avg_pace = pace_result.scalar() or 1.0  # Default to 1.0 if no history
    
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
        return None
    
    # Calculate total remaining time
    total_minutes = sum(
        skill.estimated_time_minutes or (skill.estimated_hours * 60)
        for skill in remaining_skills
    )
    
    # Adjust by user's pace
    adjusted_minutes = total_minutes * avg_pace
    
    # Convert to weeks
    weekly_minutes = weekly_hours * 60
    weeks_remaining = adjusted_minutes / weekly_minutes if weekly_minutes > 0 else 0
    
    # Calculate projected date
    projected_date = datetime.now() + timedelta(weeks=weeks_remaining)
    
    logger.info(f"Projected completion: {projected_date.date()} ({weeks_remaining:.1f} weeks remaining)")
    
    return projected_date.isoformat()


async def get_task_statistics(
    db: AsyncSession,
    roadmap_id: int
) -> Dict[str, int]:
    """
    Get task statistics for a roadmap.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
    
    Returns:
        Dictionary with task counts by status
    """
    result = await db.execute(
        select(models.Skill.status, func.count(models.Skill.id))
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(models.Roadmap.id == roadmap_id)
        .group_by(models.Skill.status)
    )
    
    status_counts = dict(result.all())
    
    return {
        "total_tasks": sum(status_counts.values()),
        "completed_tasks": status_counts.get("completed", 0),
        "in_progress_tasks": status_counts.get("in_progress", 0),
        "not_started_tasks": status_counts.get("not_started", 0)
    }


async def compute_learning_analytics(
    db: AsyncSession,
    roadmap_id: int,
    user_id: int,
    weekly_hours: int = 10
) -> Dict:
    """
    Compute comprehensive learning analytics for a roadmap.
    
    Args:
        db: Database session
        roadmap_id: ID of the roadmap
        user_id: ID of the user
        weekly_hours: Hours per week the user plans to study
    
    Returns:
        Dictionary with all analytics data
    """
    weekly_rate = await calculate_weekly_completion_rate(db, roadmap_id)
    bottlenecks = await detect_bottleneck_topics(db, roadmap_id)
    heatmap = await generate_difficulty_heatmap(db, roadmap_id)
    projected_date = await calculate_projected_completion_date(db, roadmap_id, user_id, weekly_hours)
    stats = await get_task_statistics(db, roadmap_id)
    
    return {
        "weekly_completion_rate": weekly_rate,
        "projected_completion_date": projected_date,
        "bottleneck_topics": bottlenecks,
        "difficulty_heatmap": heatmap,
        **stats
    }


async def compute_user_stats(
    db: AsyncSession,
    user_id: int
) -> Dict:
    """
    Compute aggregated user learning statistics.
    
    Args:
        db: Database session
        user_id: ID of the user
    
    Returns:
        Dictionary with user stats (streak, velocity, applied_phase, etc.)
    """
    # 1. Calculate Day Streak
    # Get all completion dates for the user, ordered by date desc
    history_result = await db.execute(
        select(func.date(models.TaskCompletion.completed_at))
        .filter(models.TaskCompletion.user_id == user_id)
        .group_by(func.date(models.TaskCompletion.completed_at))
        .order_by(func.date(models.TaskCompletion.completed_at).desc())
    )
    
    activity_dates = history_result.scalars().all()
    
    current_streak = 0
    if activity_dates:
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        
        last_active = activity_dates[0]
        
        # If user was active today or yesterday, streak is alive
        if last_active == today or last_active == yesterday:
            current_streak = 1
            current_date = last_active
            
            for i in range(1, len(activity_dates)):
                prev_date = activity_dates[i]
                if (current_date - prev_date).days == 1:
                    current_streak += 1
                    current_date = prev_date
                else:
                    break
        else:
            current_streak = 0
            
    # 2. Calculate Learning Velocity
    # Rolling 4-week average of tasks completed
    cutoff_date = datetime.now() - timedelta(weeks=4)
    velocity_result = await db.execute(
        select(func.count(models.TaskCompletion.id))
        .filter(
            models.TaskCompletion.user_id == user_id,
            models.TaskCompletion.completed_at >= cutoff_date
        )
    )
    
    total_tasks_last_month = velocity_result.scalar() or 0
    # Velocity = tasks per week (averaged over 4 weeks)
    learning_velocity = round(total_tasks_last_month / 4.0, 1)
    
    # 3. Calculate Applied Phase Progress
    # Count skills with phase='Applied' or 'Project'
    applied_result = await db.execute(
        select(
            func.count(models.Skill.id),
            func.sum(case((models.Skill.status == 'completed', 1), else_=0))
        )
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(
            models.Roadmap.owner_id == user_id,
            models.Skill.phase.in_(['Applied', 'Project'])
        )
    )
    
    row = applied_result.one()
    total_applied = row[0] or 0
    completed_applied = row[1] or 0
    
    applied_phase_progress = 0.0
    if total_applied > 0:
        applied_phase_progress = round((completed_applied / total_applied) * 100, 1)

    # Get last active timestamp
    last_active_query = await db.execute(
        select(models.User.last_active_at).filter(models.User.id == user_id)
    )
    last_active_at = last_active_query.scalar()

    return {
        "current_streak": current_streak,
        "learning_velocity": learning_velocity,
        "applied_phase_progress": applied_phase_progress,
        "last_active_at": last_active_at.isoformat() if last_active_at else None
    }
