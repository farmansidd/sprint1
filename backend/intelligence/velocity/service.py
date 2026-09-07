
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta
from app.models import TaskCompletion, ProjectSubmission
from learning_state.models import LearningState
from intelligence.mastery.service import calculate_mastery
from intelligence.decisions.engine import recommend_next_task
from typing import List
import math

async def update_learning_state(user_id: int, db: AsyncSession):
    """
    Computes and updates the read-only LearningState for a user.
    Called after TaskCompletion events (Phase 1).
    """
    
    # 1. Period Calculation (Last 30 Days)
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    # 2. Fetch Metrics Source Data
    
    # A. Task Completion Velocity (Tasks / Week)
    stmt_completions = select(TaskCompletion).where(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= thirty_days_ago
    ).order_by(TaskCompletion.completed_at.asc())
    
    result_completions = await db.execute(stmt_completions)
    completions = result_completions.scalars().all()
    
    total_completions = len(completions)
    # Tasks per week = (Total / 30) * 7
    tasks_per_week = (total_completions / 30.0) * 7.0
    
    # B. Retry Rate (Submissions per success) or (Total Fails / Total Success)?
    # Let's do Avg Fails per Pass (for completed tasks)
    # Simple proxy: (Total Submissions - Total Completions) / Total Completions
    # Or just count all submissions in last 30 days
    
    stmt_subs = select(func.count(ProjectSubmission.id)).where(
        ProjectSubmission.user_id == user_id,
        ProjectSubmission.submitted_at >= thirty_days_ago
    )
    result_subs = await db.execute(stmt_subs)
    total_submissions = result_subs.scalar() or 0
    
    retry_rate = 0.0
    if total_completions > 0:
        # If 10 subs and 5 completions -> 2 subs per task -> 1 retry per task??
        # Let's definte Retry Rate as (Total Submissions / Completions)
        retry_rate = total_submissions / float(total_completions)
    
    # C. Time to Pass (Median Minutes)
    # We rely on TaskCompletion.time_spent_minutes if populated.
    # If not populated (e.g. from submissions), we might need to compute diff between first submit and pass.
    # For now, let's use what we have or default to 0.
    times = [c.time_spent_minutes for c in completions if c.time_spent_minutes is not None]
    avg_mid_time = 0.0
    if times:
         avg_mid_time = sum(times) / len(times)
         
    # D. Last Active
    last_active = now # If we are running this, they are active.
    
    # 3. Determine Velocity Band
    # Band Logic:
    # STALLED: < 0.5 tasks/week
    # SLOW: 0.5 - 2 tasks/week
    # NORMAL: 2 - 5 tasks/week
    # FAST: > 5 tasks/week
    
    band = "NORMAL"
    if tasks_per_week < 0.5:
        band = "STALLED"
    elif tasks_per_week < 2.0:
        band = "SLOW"
    elif tasks_per_week < 5.0:
        band = "NORMAL"
    else:
        band = "FAST"
        
    # 4. Update or Create LearningState
    stmt_state = select(LearningState).where(LearningState.user_id == user_id)
    result_state = await db.execute(stmt_state)
    state = result_state.scalar_one_or_none()
    
    if not state:
        state = LearningState(user_id=user_id)
        db.add(state)
    
    state.avg_tasks_per_week = tasks_per_week
    state.avg_time_to_pass_minutes = avg_mid_time
    state.retry_rate = retry_rate
    state.last_active_at = last_active
    state.current_velocity_band = band
    
    # 5. Calculate Mastery (New Phase 2 Step)
    mastery_score, mastery_level, quiz_avg, project_avg = await calculate_mastery(user_id, db)
    state.mastery_score = mastery_score
    state.mastery_level = mastery_level
    state.quiz_average = quiz_avg * 100 # Convert to percentage for display
    state.project_average = project_avg * 100 # Convert to percentage
    
    # 6. Adaptive Recommendation (New Phase 2 Step)
    # Note: recommend_next_task is sync for now, as it just uses state
    next_task = recommend_next_task(state)
    state.next_recommended_task_id = next_task
    
    await db.commit()
    await db.refresh(state)
    
    return state
