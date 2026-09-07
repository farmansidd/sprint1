from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_active_user
from app.schemas import User, DashboardResponse
import app.models as models
import app.crud as crud

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    print(f"Dashboard API called for user: {current_user.id} ({current_user.username})")
    # Fetch all roadmaps for the user
    roadmaps_from_db = await crud.get_roadmaps_by_user(db, current_user.id)
    print(f"Found {len(roadmaps_from_db)} roadmaps for user")
    
    roadmaps_progress = []
    total_skills = 0
    completed_skills = 0
    all_skills = []

    for roadmap in roadmaps_from_db:
        roadmap_total_skills = 0
        roadmap_completed_skills = 0
        for topic in roadmap.topics:
            for subtopic in topic.subtopics:
                roadmap_total_skills += len(subtopic.skills)
                for skill in subtopic.skills:
                    all_skills.append({
                        "skill_id": skill.id,
                        "name": skill.name,
                        "category": skill.category,
                        "difficulty": skill.difficulty,
                        "status": skill.status,
                        "due_date": None, # Placeholder
                    })
                    if skill.status == "completed":
                        roadmap_completed_skills += 1
        
        progress = (roadmap_completed_skills / roadmap_total_skills * 100) if roadmap_total_skills > 0 else 0
        roadmaps_progress.append({
            "id": roadmap.id,
            "title": roadmap.title,
            "progress": progress,
            "total_skills": roadmap_total_skills,
            "completed_skills": roadmap_completed_skills
        })
        total_skills += roadmap_total_skills
        completed_skills += roadmap_completed_skills

    overall_progress_percent = (completed_skills / total_skills * 100) if total_skills > 0 else 0

    response_data = {
        "user_id": current_user.id,
        "username": current_user.username,
        "roadmaps": roadmaps_progress,
        "dashboard_stats": {
            "total_skills": total_skills,
            "completed_skills": completed_skills,
            "pending_skills": total_skills - completed_skills, # Simplified pending skills
            "not_started_skills": 0, # This metric might need re-evaluation
            "progress_percent": overall_progress_percent
        },
        "skills": all_skills
    }

    print(f"Dashboard response: total_skills={total_skills}, completed_skills={completed_skills}, skills_count={len(all_skills)}")
    return response_data

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    # 1. Fetch Roadmaps for context
    # Assuming primary roadmap or aggregating all
    roadmaps = await crud.get_roadmaps_by_user(db, current_user.id)
    
    total_goals = len(roadmaps)
    completed_goals = sum(1 for r in roadmaps if r.progress_percent >= 100) # Assuming progress_percent exists
    
    # 2. Get Real Analytics
    from app.services.advanced_analytics import get_behavioral_patterns, calculate_skill_mastery
    
    analytics = await get_behavioral_patterns(db, current_user.id, days_back=30)
    
    total_mastery_avg = 0
    count_roadmaps = 0
    
    for r in roadmaps:
        mastery = await calculate_skill_mastery(db, r.id, current_user.id)
        total_mastery_avg += mastery['overall_proficiency']
        count_roadmaps += 1
        
    avg_proficiency = total_mastery_avg / count_roadmaps if count_roadmaps > 0 else 0
    
    # 3. Aggregate
    # "Total Skills" -> Total Topics/Levels or Tasks? 
    # Let's use "Total Items" from analytics or sum of skills in roadmaps.
    # For now, let's use the analytics "total_completions" as a proxy for completed items.
    
    return {
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "total_skills": analytics.get('total_completions', 0) + 10, # Mock total if unknown, or just completions
        "completed_skills": analytics.get('total_completions', 0),
        "roadmap_progress": round(avg_proficiency, 1), # Using mastery as progress proxy
        "activity_score": analytics.get('activity_score', 0)
    }

@router.get("/dashboard/goals")
async def get_dashboard_goals(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    # Placeholder for user's goals summary
    return [
        {"id": 1, "name": "Become a Senior Developer", "status": "In Progress", "progress": 50},
        {"id": 2, "name": "Learn Machine Learning", "status": "Completed", "progress": 100},
        {"id": 3, "name": "Improve Communication Skills", "status": "Not Started", "progress": 0}
    ]

@router.get("/dashboard/recommendations")
async def get_dashboard_recommendations(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    from app.services.advanced_analytics import generate_smart_recommendations
    import app.crud as crud
    
    # Needs a roadmap context. Pick the first active one.
    roadmaps = await crud.get_roadmaps_by_user(db, current_user.id)
    if not roadmaps:
        return [
             {"id": 1, "type": "onboarding", "title": "Start Your Journey", "description": "Create your first roadmap to get personalized recommendations.", "progress": 0}
        ]
        
    # Use the first roadmap for now
    roadmap_id = roadmaps[0].id
    
    recommendations = await generate_smart_recommendations(db, current_user.id, roadmap_id)
    
    # Map to frontend format if needed
    # Frontend expects: id, type, title, description, progress
    formatted = []
    for idx, rec in enumerate(recommendations):
        formatted.append({
            "id": idx + 1,
            "type": rec.get('type', 'general'),
            "title": rec['title'],
            "description": rec['description'],
            "progress": 0, # Recommendations usually don't have progress unless they are goals
            "actionable": rec.get('actionable', False)
        })
        
    if not formatted:
        formatted.append(
             {"id": 1, "type": "info", "title": "Keep Learning", "description": "Complete more quizzes and projects to unlock insights.", "progress": 0}
        )
        
    return formatted
