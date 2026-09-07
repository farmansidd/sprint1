from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import json 
import app.schemas as schemas
import app.crud as crud
from app.dependencies import get_db, get_current_active_user
from app.models import User, AIResponse
from app.services.ai_service_updated import generate_roadmap_from_goal
from app.services.learning_analytics import compute_learning_analytics
from app.services.time_forecasting import forecast_completion_timeline
import app.crud_enhanced as crud_enhanced

router = APIRouter(
    prefix="/roadmaps",
    tags=["roadmaps"],
)

@router.post("/generate", response_model=schemas.Roadmap)
async def generate_roadmap(
    roadmap_generate: schemas.RoadmapGenerate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    import traceback
    import logging

    logging.info(f"Received roadmap generation request for goal: {roadmap_generate.goal}, skill_level: {roadmap_generate.skill_level}")

    try:
        # Call AI service to generate roadmap content with skill level
        ai_generated_roadmap_data = await generate_roadmap_from_goal(
            roadmap_generate.goal,
            roadmap_generate.skill_level,
            roadmap_generate.weekly_hours,
            holland_code=current_user.holland_code,
            personality_traits=current_user.personality_traits
        )
        logging.info(f"AI generated roadmap data: {ai_generated_roadmap_data}")

        if not ai_generated_roadmap_data or "title" not in ai_generated_roadmap_data:
            logging.error("Failed to generate roadmap from AI: Missing 'title' in response.")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate roadmap from AI.")

        # Create roadmap and its hierarchy in the database
        db_roadmap = await crud.create_full_roadmap_from_ai(
            db=db,
            ai_roadmap_data=schemas.AIGeneratedRoadmap(**ai_generated_roadmap_data),
            user_id=current_user.id,
            goal=roadmap_generate.goal,
            ai_generated_content=json.dumps(ai_generated_roadmap_data)
        )

        logging.info(f"Roadmap created with ID: {db_roadmap.id}")
        logging.info(f"Returning roadmap object: {db_roadmap}")
        return db_roadmap

    except Exception as e:
        logging.error(f"Exception during roadmap generation: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/", response_model=schemas.Roadmap)
async def create_roadmap(
    roadmap: schemas.RoadmapCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await crud.create_roadmap(db=db, roadmap=roadmap, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Roadmap])
@router.get("", response_model=List[schemas.Roadmap])
async def read_roadmaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return await crud.get_roadmaps_by_user(db=db, user_id=current_user.id)

@router.get("/{roadmap_id}", response_model=schemas.Roadmap)
async def read_roadmap(
    roadmap_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_roadmap = await crud.get_roadmap(db, roadmap_id=roadmap_id)
    if db_roadmap is None:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return db_roadmap

@router.put("/skills/{skill_id}", response_model=schemas.Skill)
async def update_skill(
    skill_id: int,
    skill: schemas.SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_skill = await crud.get_skill_for_user(db, skill_id=skill_id, user_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found or not authorized")
    return await crud.update_skill(db=db, skill_id=skill_id, skill=skill)

@router.delete("/skills/{skill_id}", response_model=schemas.Skill)
async def delete_skill(
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_skill = await crud.get_skill_for_user(db, skill_id=skill_id, user_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found or not authorized")
    return await crud.delete_skill(db=db, skill_id=skill_id)

@router.put("/{skill_id}/status", response_model=schemas.Skill)
async def update_skill_status(
    skill_id: int,
    skill_status: schemas.SkillStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_skill = await crud.get_skill_for_user(db, skill_id=skill_id, user_id=current_user.id)
    if db_skill is None:
        raise HTTPException(status_code=404, detail="Skill not found or not authorized")
    return await crud.update_skill_status(db=db, skill_id=skill_id, status=skill_status.status)