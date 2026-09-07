"""
Enhanced API endpoints for roadmap features
Task status updates, versioning, analytics, milestones, quizzes, and forecasting
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

import app.schemas as schemas
import app.crud_enhanced as crud_enhanced
from app.dependencies import get_db, get_current_active_user
from app.models import User
from app.services.learning_analytics import compute_learning_analytics
from app.services.time_forecasting import forecast_completion_timeline

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/roadmaps",
    tags=["roadmaps-enhanced"],
)


# ============================================================================
# Task Status Updates
# ============================================================================

@router.post("/tasks/{skill_id}/status", response_model=dict)
async def update_task_status(
    skill_id: int,
    status_update: schemas.TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the status of a task and recalculate roadmap progress.
    """
    try:
        # Verify user owns this skill
        result = await crud_enhanced.update_task_status_enhanced(
            db=db,
            skill_id=skill_id,
            status=status_update.status,
            user_id=current_user.id
        )
        
        return {
            "id": result["id"],
            "status": result["status"],
            "updated_at": result["completed_at"].isoformat() if result["completed_at"] else None
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        logger.error(f"Error updating task status: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Roadmap Versioning
# ============================================================================

@router.get("/{roadmap_id}/versions", response_model=List[schemas.RoadmapVersionSchema])
async def get_roadmap_versions(
    roadmap_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all versions of a roadmap.
    """
    try:
        versions = await crud_enhanced.get_roadmap_versions(db, roadmap_id)
        
        return [
            schemas.RoadmapVersionSchema(
                id=v.id,
                roadmap_id=v.roadmap_id,
                version_number=v.version_number,
                snapshot_data=v.snapshot_data,
                changes_summary=v.changes_summary or "",
                created_at=v.created_at.isoformat()
            )
            for v in versions
        ]
    except Exception as e:
        logger.error(f"Error getting roadmap versions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get versions")


@router.post("/{roadmap_id}/versions", response_model=schemas.RoadmapVersionSchema)
async def create_roadmap_version(
    roadmap_id: int,
    changes_summary: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new version snapshot of the roadmap.
    """
    try:
        version = await crud_enhanced.create_roadmap_version(
            db=db,
            roadmap_id=roadmap_id,
            changes_summary=changes_summary
        )
        
        return schemas.RoadmapVersionSchema(
            id=version.id,
            roadmap_id=version.roadmap_id,
            version_number=version.version_number,
            snapshot_data=version.snapshot_data,
            changes_summary=version.changes_summary or "",
            created_at=version.created_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating roadmap version: {e}")
        raise HTTPException(status_code=500, detail="Failed to create version")


# ============================================================================
# Analytics
# ============================================================================

@router.get("/{roadmap_id}/analytics", response_model=schemas.LearningAnalytics)
async def get_roadmap_analytics(
    roadmap_id: int,
    weekly_hours: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive learning analytics for a roadmap.
    """
    try:
        analytics = await compute_learning_analytics(
            db=db,
            roadmap_id=roadmap_id,
            user_id=current_user.id,
            weekly_hours=weekly_hours
        )
        
        return schemas.LearningAnalytics(**analytics)
    except Exception as e:
        logger.error(f"Error computing analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute analytics")


# ============================================================================
# Milestones
# ============================================================================

@router.get("/{roadmap_id}/milestones", response_model=List[schemas.MilestoneSchema])
async def get_roadmap_milestones(
    roadmap_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all milestones for a roadmap.
    """
    try:
        milestones = await crud_enhanced.get_milestones(db, roadmap_id)
        
        if not milestones:
            # Auto-generate milestones if they don't exist
            milestones = await crud_enhanced.create_milestones_from_roadmap(db, roadmap_id)
        
        return [
            schemas.MilestoneSchema(
                id=m.id,
                roadmap_id=m.roadmap_id,
                phase=m.phase,
                name=m.name,
                description=m.description or "",
                order_index=m.order_index,
                progress=m.progress,
                total_tasks=m.total_tasks,
                completed_tasks=m.completed_tasks
            )
            for m in milestones
        ]
    except Exception as e:
        logger.error(f"Error getting milestones: {e}")
        raise HTTPException(status_code=500, detail="Failed to get milestones")


@router.post("/{roadmap_id}/milestones", response_model=List[schemas.MilestoneSchema])
async def create_roadmap_milestones(
    roadmap_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Auto-generate milestones for a roadmap.
    """
    try:
        milestones = await crud_enhanced.create_milestones_from_roadmap(db, roadmap_id)
        
        return [
            schemas.MilestoneSchema(
                id=m.id,
                roadmap_id=m.roadmap_id,
                phase=m.phase,
                name=m.name,
                description=m.description or "",
                order_index=m.order_index,
                progress=m.progress,
                total_tasks=m.total_tasks,
                completed_tasks=m.completed_tasks
            )
            for m in milestones
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating milestones: {e}")
        raise HTTPException(status_code=500, detail="Failed to create milestones")


# ============================================================================
# Quizzes
# ============================================================================

@router.post("/{roadmap_id}/quiz/generate", response_model=schemas.QuizSchema)
async def generate_quiz(
    roadmap_id: int,
    section_id: str,
    section_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate an AI quiz for a roadmap section.
    Note: This is a placeholder - actual AI quiz generation would be implemented.
    """
    # Placeholder quiz data
    quiz_data = schemas.QuizCreate(
        roadmap_id=roadmap_id,
        section_id=section_id,
        section_name=section_name,
        questions=[
            schemas.QuizQuestionBase(
                question=f"Sample question for {section_name}?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer="Option A",
                explanation="This is a sample explanation.",
                order_index=0
            )
        ]
    )
    
    try:
        quiz = await crud_enhanced.create_quiz(db, quiz_data)
        
        return schemas.QuizSchema(
            id=quiz.id,
            roadmap_id=quiz.roadmap_id,
            section_id=quiz.section_id,
            section_name=quiz.section_name,
            created_at=quiz.created_at.isoformat(),
            questions=[
                schemas.QuizQuestionSchema(
                    id=q.id,
                    quiz_id=q.quiz_id,
                    question=q.question,
                    options=q.options,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation or "",
                    order_index=q.order_index
                )
                for q in quiz.questions
            ]
        )
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz")


@router.post("/quiz/{quiz_id}/submit", response_model=schemas.QuizResult)
async def submit_quiz(
    quiz_id: int,
    submission: schemas.QuizSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Submit quiz answers and get graded results.
    """
    try:
        result = await crud_enhanced.grade_quiz_submission(
            db=db,
            quiz_id=quiz_id,
            answers=submission.answers
        )
        
        return schemas.QuizResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error grading quiz: {e}")
        raise HTTPException(status_code=500, detail="Failed to grade quiz")


# ============================================================================
# Time Forecasting
# ============================================================================

@router.get("/{roadmap_id}/forecast", response_model=schemas.TimeForecasting)
async def get_time_forecast(
    roadmap_id: int,
    weekly_hours: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get personalized time forecast for roadmap completion.
    """
    try:
        forecast = await forecast_completion_timeline(
            db=db,
            roadmap_id=roadmap_id,
            user_id=current_user.id,
            weekly_hours=weekly_hours
        )
        
        return schemas.TimeForecasting(**forecast)
    except Exception as e:
        logger.error(f"Error forecasting completion: {e}")
        raise HTTPException(status_code=500, detail="Failed to forecast completion")
