from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db, get_current_active_user
from app.schemas import User
import app.services.learning_analytics as analytics_service
import app.services.advanced_analytics as advanced_analytics

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

@router.get("/user-summary")
async def get_user_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated user learning statistics (streak, velocity, applied progress).
    """
    stats = await analytics_service.compute_user_stats(db, current_user.id)
    return stats


@router.get("/behavioral-patterns")
async def get_behavioral_patterns(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    days_back: int = Query(30, ge=7, le=90)
):
    """
    Get behavioral patterns including activity heatmap and productivity insights.
    """
    patterns = await advanced_analytics.get_behavioral_patterns(db, current_user.id, days_back)
    return patterns


@router.get("/skill-mastery/{roadmap_id}")
async def get_skill_mastery(
    roadmap_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed skill mastery analysis for a roadmap.
    """
    mastery = await advanced_analytics.calculate_skill_mastery(db, roadmap_id, current_user.id)
    return mastery


@router.get("/performance-insights")
async def get_performance_insights(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    weeks: int = Query(8, ge=4, le=52)
):
    """
    Get performance trends and efficiency metrics over time.
    """
    insights = await advanced_analytics.get_performance_insights(db, current_user.id, weeks)
    return insights


@router.get("/comparative")
async def get_comparative_analytics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Compare user performance against platform averages.
    """
    comparison = await advanced_analytics.get_comparative_analytics(db, current_user.id)
    return comparison


@router.get("/recommendations/{roadmap_id}")
async def get_recommendations(
    roadmap_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered personalized learning recommendations.
    """
    recommendations = await advanced_analytics.generate_smart_recommendations(
        db, current_user.id, roadmap_id
    )
    return {"recommendations": recommendations}


@router.get("/focus-insights")
async def get_focus_insights(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    days_back: int = Query(14, ge=7, le=30)
):
    """
    Get focus patterns and session duration analysis.
    """
    focus = await advanced_analytics.get_focus_insights(db, current_user.id, days_back)
    return focus
