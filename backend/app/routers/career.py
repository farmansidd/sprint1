from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.dependencies import get_current_user, get_current_active_user
from app.models import User, UserSkillLevel
from app.schemas_career import PsychProfileSubmit, CareerExplorationResult
from app.services.ai_service_updated import generate_career_suggestions
import logging

router = APIRouter(
    prefix="/career",
    tags=["Career Exploration"]
)

logger = logging.getLogger(__name__)

@router.post("/psych-profile", status_code=status.HTTP_200_OK)
async def submit_psych_profile(
    profile: PsychProfileSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit psychometric profile results (Holland Code & Traits).
    """
    try:
        current_user.holland_code = profile.holland_code
        current_user.personality_traits = profile.personality_traits
        
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"Updated psych profile for user {current_user.id}: {profile.holland_code}")
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating psych profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.get("/explore", response_model=CareerExplorationResult)
async def explore_careers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate career suggestions based on the user's psychometric profile and existing skills.
    """
    if not current_user.holland_code or not current_user.personality_traits:
        raise HTTPException(
            status_code=400, 
            detail="Psychometric profile not found. Please complete the assessment first."
        )
    
    try:
        # Fetch user's existing skills/domains
        result = await db.execute(
            select(UserSkillLevel).filter(UserSkillLevel.user_id == current_user.id)
        )
        user_skills_levels = result.scalars().all()
        experienced_skills = [skill.domain for skill in user_skills_levels if skill.domain] # Extract distinct domains
        
        # Generate suggestions using AI, now with skill context
        suggestions = await generate_career_suggestions(
            holland_code=current_user.holland_code,
            traits=current_user.personality_traits,
            experienced_skills=experienced_skills
        )
        
        return suggestions
    except Exception as e:
        logger.error(f"Error exploring careers: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate suggestions")
