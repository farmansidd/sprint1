"""
Quiz API Router

Endpoints for quiz generation, submission, and retrieval
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.quiz_service import QuizService
from app.schemas_assessments import (
    QuizSchema,
    QuizAnswerSubmission,
    QuizAttemptResponse,
    TopicCompletionResponse,
    LevelCompletionResponse,
)

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/level/{level_id}", response_model=QuizSchema)
async def get_quiz_for_level(
    level_id: int,
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get or generate a quiz for a specific level

    Args:
        level_id: The level to get quiz for
        roadmap_id: The roadmap containing this level

    Returns:
        Quiz with questions (correct answers hidden)
    """
    quiz_service = QuizService(db)

    try:
        quiz = await quiz_service.generate_quiz_for_level(level_id, roadmap_id)

        # Don't expose correct answers or explanations when fetching quiz
        quiz_dict = QuizSchema.from_orm(quiz).dict()

        return quiz_dict

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate quiz: {str(e)}"
        )


@router.get("/topic/{topic_id}", response_model=QuizSchema)
async def get_quiz_for_topic(
    topic_id: int,
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get or generate a quiz for a specific topic

    Args:
        topic_id: The topic to get quiz for
        roadmap_id: The roadmap containing this topic

    Returns:
        Quiz with questions (correct answers hidden)
    """
    quiz_service = QuizService(db)

    try:
        quiz = await quiz_service.generate_quiz_for_topic(topic_id, roadmap_id)

        # Don't expose correct answers or explanations when fetching quiz
        quiz_dict = QuizSchema.from_orm(quiz).dict()

        return quiz_dict

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate quiz: {str(e)}"
        )


@router.post("/{quiz_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    quiz_id: int,
    roadmap_id: int,
    submission: QuizAnswerSubmission,
    level_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a quiz attempt and get immediate grading

    Args:
        quiz_id: The quiz being attempted
        roadmap_id: Roadmap ID for analytics
        submission: User's answers
        level_id: Optional Level ID for analytics
        topic_id: Optional Topic ID for analytics

    Returns:
        Graded attempt with score
    """
    quiz_service = QuizService(db)

    try:
        attempt = await quiz_service.submit_quiz_attempt(
            user_id=current_user.id,
            quiz_id=quiz_id,
            topic_id=topic_id,
            level_id=level_id,
            roadmap_id=roadmap_id,
            answers=submission.answers,
        )

        return QuizAttemptResponse.from_orm(attempt)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit quiz: {str(e)}"
        )


@router.get("/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
async def get_quiz_attempts_for_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's attempts for a specific quiz
    """
    quiz_service = QuizService(db)
    attempts = await quiz_service.get_user_quiz_attempts(
        user_id=current_user.id, quiz_id=quiz_id
    )

    return [QuizAttemptResponse.from_orm(attempt) for attempt in attempts]


@router.get("/attempts/me", response_model=List[QuizAttemptResponse])
async def get_my_quiz_attempts(
    topic_id: int = None,
    level_id: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's quiz attempts, optionally filtered by topic or level

    Args:
        topic_id: Optional topic filter
        level_id: Optional level filter

    Returns:
        List of quiz attempts
    """
    quiz_service = QuizService(db)
    attempts = await quiz_service.get_user_quiz_attempts(
        current_user.id, topic_id, level_id
    )

    return [QuizAttemptResponse.from_orm(attempt) for attempt in attempts]


@router.get("/topic/{topic_id}/completion", response_model=TopicCompletionResponse)
async def get_topic_completion(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get topic completion status including quiz and project scores

    Args:
        topic_id: Topic to check completion for

    Returns:
        Topic completion details
    """
    quiz_service = QuizService(db)
    completion = await quiz_service.get_topic_completion(current_user.id, topic_id)

    if not completion:
        raise HTTPException(
            status_code=404, detail="No completion record found for this topic"
        )

    return TopicCompletionResponse.from_orm(completion)


@router.get("/level/{level_id}/completion", response_model=LevelCompletionResponse)
async def get_level_completion(
    level_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get level completion status including quiz and project scores

    Args:
        level_id: Level to check completion for

    Returns:
        Level completion details
    """
    quiz_service = QuizService(db)
    completion = await quiz_service.get_level_completion(current_user.id, level_id)

    if not completion:
        raise HTTPException(
            status_code=404, detail="No completion record found for this level"
        )

    return LevelCompletionResponse.from_orm(completion)
