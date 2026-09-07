
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models import TaskCompletion, ProjectSubmission, AutoGradingResult, TopicCompletion
from typing import Tuple

async def calculate_mastery(user_id: int, db: AsyncSession) -> Tuple[float, str]:
    """
    Calculates the user's mastery score and level.
    Inputs: Data from Phase 1 (Truth).
    Output: (Score 0.0-1.0, Level String, Quiz Avg, Project Avg)
    """
    
    # 1. Fetch Project Performance (Weight: 70%)
    # Pass Rate = Passed Projects / Total Submitted Projects (unique tasks)
    stmt_projects = select(AutoGradingResult).join(ProjectSubmission).where(
        ProjectSubmission.user_id == user_id,
        AutoGradingResult.status == 'passed'
    )
    result_projects = await db.execute(stmt_projects)
    passed_projects = len(result_projects.scalars().all())
    
    # Project Mastery Score (0.0 - 1.0)
    # Cap at 1.0 for ~10 passed projects
    project_score = min(passed_projects / 10.0, 1.0)
    
    # 2. Fetch Quiz Performance (Weight: 30%)
    stmt_quizzes = select(TopicCompletion).where(
        TopicCompletion.user_id == user_id,
        TopicCompletion.quiz_score.isnot(None)
    )
    result_quizzes = await db.execute(stmt_quizzes)
    quiz_completions = result_quizzes.scalars().all()
    
    if quiz_completions:
        # Calculate average normalized score (quiz_score is usually out of 5)
        # We assume max score is 5 for now. Ideally, max_score should be stored or fetched.
        # But QuizService implies 5 questions.
        total_quiz_score_normalized = sum(qc.quiz_score / 5.0 for qc in quiz_completions)
        quiz_score = total_quiz_score_normalized / len(quiz_completions)
        # Cap just in case
        quiz_score = min(quiz_score, 1.0)
    else:
        quiz_score = 0.0
    
    # 3. Weighted Mastery Score
    # Project (70%) + Quiz (30%)
    final_score = (project_score * 0.70) + (quiz_score * 0.30)
    
    # 4. Determine Level 
    
    # 4. Determine Level
    level = "Beginner"
    if final_score >= 0.8:
        level = "Expert"
    elif final_score >= 0.3:
        level = "Proficient"
        
    if final_score >= 0.8:
        level = "Expert"
    elif final_score >= 0.3:
        level = "Proficient"
        
    return final_score, level, quiz_score, project_score
