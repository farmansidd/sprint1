"""
Enhanced CRUD operations for roadmap system
Includes versioning, analytics, milestones, and quizzes
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete, func
from datetime import datetime
import json
import logging

import app.models as models
import app.schemas as schemas

logger = logging.getLogger(__name__)


# ============================================================================
# Task Status and Completion Tracking
# ============================================================================

async def update_task_status_enhanced(
    db: AsyncSession,
    skill_id: int,
    status: str,
    user_id: int,
    time_spent_minutes: int = None
) -> dict:
    """
    Update task status and track completion metrics.
    Also updates roadmap progress percentage.
    """
    result = await db.execute(
        select(models.Skill)
        .options(
            selectinload(models.Skill.subtopic)
            .selectinload(models.Subtopic.topic)
        )
        .filter(models.Skill.id == skill_id)
    )
    skill = result.scalar_one_or_none()
    
    if not skill:
        raise ValueError(f"Skill {skill_id} not found")
    
    old_status = skill.status
    skill.status = status
    
    # Track completion time
    if status == "completed" and old_status != "completed":
        skill.completed_at = datetime.now()
        
        if time_spent_minutes:
            skill.actual_time_minutes = time_spent_minutes
            
            # Create learning pace metric
            estimated = skill.estimated_time_minutes or (skill.estimated_hours * 60)
            if estimated > 0:
                pace_metric = models.LearningPaceMetric(
                    user_id=user_id,
                    skill_id=skill_id,
                    estimated_minutes=estimated,
                    actual_minutes=time_spent_minutes,
                    pace_multiplier=time_spent_minutes / estimated
                )
                db.add(pace_metric)
    
    
    # Extract roadmap_id BEFORE commit to avoid detached object issues
    roadmap_id = None
    if skill.subtopic and skill.subtopic.topic:
        roadmap_id = skill.subtopic.topic.roadmap_id
    
    await db.commit()
    await db.refresh(skill)
    
    # Extract values while still in session context
    result = {
        "id": skill.id,
        "status": skill.status,
        "completed_at": skill.completed_at
    }
    
    # Update roadmap progress after commit
    if roadmap_id:
        await update_roadmap_progress(db, roadmap_id)
    else:
        # Fallback: Try to find roadmap_id via direct query if object navigation failed
        stmt = (
            select(models.Topic.roadmap_id)
            .join(models.Subtopic, models.Subtopic.topic_id == models.Topic.id)
            .join(models.Skill, models.Skill.subtopic_id == models.Subtopic.id)
            .filter(models.Skill.id == skill_id)
        )
        roadmap_id_result = await db.execute(stmt)
        roadmap_id = roadmap_id_result.scalar_one_or_none()
        
        if roadmap_id:
             await update_roadmap_progress(db, roadmap_id)
        else:
            logger.warning(f"Skill {skill_id} has broken hierarchy: subtopic or topic missing. Roadmap progress update skipped.")
    
    logger.info(f"Updated skill {skill_id} status: {old_status} -> {status}")
    
    return result


async def update_roadmap_progress(db: AsyncSession, roadmap_id: int) -> None:
    """
    Recalculate and update roadmap progress percentage.
    """
    # Get all skills for this roadmap
    result = await db.execute(
        select(models.Skill)
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    skills = result.scalars().all()
    
    if not skills:
        return
    
    total_skills = len(skills)
    completed_skills = sum(1 for skill in skills if skill.status == "completed")
    
    progress_percent = (completed_skills / total_skills) * 100 if total_skills > 0 else 0
    
    # Update roadmap
    roadmap_result = await db.execute(
        select(models.Roadmap).filter(models.Roadmap.id == roadmap_id)
    )
    roadmap = roadmap_result.scalar_one_or_none()
    
    if roadmap:
        roadmap.progress_percent = progress_percent
        roadmap.updated_at = datetime.now()
        await db.commit()
        
        logger.info(f"Updated roadmap {roadmap_id} progress: {progress_percent:.1f}%")


# ============================================================================
# Roadmap Versioning
# ============================================================================

async def create_roadmap_version(
    db: AsyncSession,
    roadmap_id: int,
    changes_summary: str = None
) -> models.RoadmapVersion:
    """
    Create a snapshot version of the current roadmap state.
    """
    # Get the full roadmap with all relationships
    result = await db.execute(
        select(models.Roadmap)
        .options(
            selectinload(models.Roadmap.topics)
            .selectinload(models.Topic.subtopics)
            .selectinload(models.Subtopic.skills)
        )
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    roadmap = result.scalar_one_or_none()
    
    if not roadmap:
        raise ValueError(f"Roadmap {roadmap_id} not found")
    
    # Create snapshot data
    snapshot = {
        "title": roadmap.title,
        "description": roadmap.description,
        "goal": roadmap.goal,
        "skill_level": roadmap.skill_level,
        "progress_percent": roadmap.progress_percent,
        "topics": []
    }
    
    for topic in roadmap.topics:
        topic_data = {
            "name": topic.name,
            "description": topic.description,
            "subtopics": []
        }
        
        for subtopic in topic.subtopics:
            subtopic_data = {
                "name": subtopic.name,
                "description": subtopic.description,
                "skills": []
            }
            
            for skill in subtopic.skills:
                skill_data = {
                    "id": skill.id,
                    "name": skill.name,
                    "category": skill.category,
                    "status": skill.status,
                    "difficulty": skill.difficulty,
                    "estimated_time_minutes": skill.estimated_time_minutes,
                    "actual_time_minutes": skill.actual_time_minutes
                }
                subtopic_data["skills"].append(skill_data)
            
            topic_data["subtopics"].append(subtopic_data)
        
        snapshot["topics"].append(topic_data)
    
    # Get current version number
    version_count_result = await db.execute(
        select(func.count(models.RoadmapVersion.id))
        .filter(models.RoadmapVersion.roadmap_id == roadmap_id)
    )
    version_count = version_count_result.scalar() or 0
    
    # Create version
    version = models.RoadmapVersion(
        roadmap_id=roadmap_id,
        version_number=version_count + 1,
        snapshot_data=snapshot,
        changes_summary=changes_summary
    )
    
    db.add(version)
    await db.commit()
    await db.refresh(version)
    
    logger.info(f"Created version {version.version_number} for roadmap {roadmap_id}")
    
    return version


async def get_roadmap_versions(
    db: AsyncSession,
    roadmap_id: int
) -> list[models.RoadmapVersion]:
    """
    Get all versions of a roadmap.
    """
    result = await db.execute(
        select(models.RoadmapVersion)
        .filter(models.RoadmapVersion.roadmap_id == roadmap_id)
        .order_by(models.RoadmapVersion.version_number.desc())
    )
    
    return result.scalars().all()


# ============================================================================
# Milestones
# ============================================================================

async def create_milestones_from_roadmap(
    db: AsyncSession,
    roadmap_id: int
) -> list[models.Milestone]:
    """
    Auto-generate milestones based on roadmap phases.
    """
    # Get roadmap with topics
    result = await db.execute(
        select(models.Roadmap)
        .options(
            selectinload(models.Roadmap.topics)
            .selectinload(models.Topic.subtopics)
            .selectinload(models.Subtopic.skills)
        )
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    roadmap = result.scalar_one_or_none()
    
    if not roadmap:
        raise ValueError(f"Roadmap {roadmap_id} not found")
    
    # Group topics by phase
    phase_groups = {}
    
    for topic in roadmap.topics:
        # Determine phase from topic data or skills
        phase = "Applied"  # Default
        
        for subtopic in topic.subtopics:
            for skill in subtopic.skills:
                if skill.phase:
                    phase = skill.phase
                    break
            if phase != "Applied":
                break
        
        if phase not in phase_groups:
            phase_groups[phase] = []
        
        phase_groups[phase].append(topic)
    
    # Create milestones
    milestones = []
    phase_order = {"Fundamentals": 0, "Applied": 1, "Project": 2}
    
    for phase, topics in phase_groups.items():
        # Count total and completed tasks in this phase
        total_tasks = 0
        completed_tasks = 0
        
        for topic in topics:
            for subtopic in topic.subtopics:
                for skill in subtopic.skills:
                    total_tasks += 1
                    if skill.status == "completed":
                        completed_tasks += 1
        
        progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        milestone = models.Milestone(
            roadmap_id=roadmap_id,
            phase=phase,
            name=f"{phase} Phase",
            description=f"Complete {phase.lower()} topics and skills",
            order_index=phase_order.get(phase, 99),
            progress=progress,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks
        )
        
        db.add(milestone)
        milestones.append(milestone)
    
    await db.commit()
    
    for milestone in milestones:
        await db.refresh(milestone)
    
    logger.info(f"Created {len(milestones)} milestones for roadmap {roadmap_id}")
    
    return milestones


async def get_milestones(
    db: AsyncSession,
    roadmap_id: int
) -> list[models.Milestone]:
    """
    Get all milestones for a roadmap.
    """
    result = await db.execute(
        select(models.Milestone)
        .filter(models.Milestone.roadmap_id == roadmap_id)
        .order_by(models.Milestone.order_index)
    )
    
    return result.scalars().all()


async def update_milestone_progress(
    db: AsyncSession,
    roadmap_id: int
) -> None:
    """
    Update progress for all milestones in a roadmap.
    """
    milestones = await get_milestones(db, roadmap_id)
    
    # Get roadmap with all skills
    result = await db.execute(
        select(models.Roadmap)
        .options(
            selectinload(models.Roadmap.topics)
            .selectinload(models.Topic.subtopics)
            .selectinload(models.Subtopic.skills)
        )
        .filter(models.Roadmap.id == roadmap_id)
    )
    
    roadmap = result.scalar_one_or_none()
    
    if not roadmap:
        return
    
    # Update each milestone
    for milestone in milestones:
        total_tasks = 0
        completed_tasks = 0
        
        for topic in roadmap.topics:
            for subtopic in topic.subtopics:
                for skill in subtopic.skills:
                    if skill.phase == milestone.phase:
                        total_tasks += 1
                        if skill.status == "completed":
                            completed_tasks += 1
        
        milestone.total_tasks = total_tasks
        milestone.completed_tasks = completed_tasks
        milestone.progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    await db.commit()
    
    logger.info(f"Updated milestone progress for roadmap {roadmap_id}")


# ============================================================================
# Quizzes
# ============================================================================

async def create_quiz(
    db: AsyncSession,
    quiz_data: schemas.QuizCreate
) -> models.Quiz:
    """
    Create a quiz with questions.
    """
    quiz = models.Quiz(
        roadmap_id=quiz_data.roadmap_id,
        section_id=quiz_data.section_id,
        section_name=quiz_data.section_name
    )
    
    db.add(quiz)
    await db.flush()  # Get quiz ID
    
    # Add questions
    for idx, question_data in enumerate(quiz_data.questions):
        question = models.QuizQuestion(
            quiz_id=quiz.id,
            question=question_data.question,
            options=question_data.options,
            correct_answer=question_data.correct_answer,
            explanation=question_data.explanation,
            order_index=idx
        )
        db.add(question)
    
    await db.commit()
    await db.refresh(quiz)
    
    logger.info(f"Created quiz {quiz.id} with {len(quiz_data.questions)} questions")
    
    return quiz


async def get_quiz(
    db: AsyncSession,
    quiz_id: int
) -> models.Quiz:
    """
    Get a quiz with all questions.
    """
    result = await db.execute(
        select(models.Quiz)
        .options(selectinload(models.Quiz.questions))
        .filter(models.Quiz.id == quiz_id)
    )
    
    return result.scalar_one_or_none()


async def grade_quiz_submission(
    db: AsyncSession,
    quiz_id: int,
    answers: list[str]
) -> dict:
    """
    Grade a quiz submission and return results.
    """
    quiz = await get_quiz(db, quiz_id)
    
    if not quiz:
        raise ValueError(f"Quiz {quiz_id} not found")
    
    questions = sorted(quiz.questions, key=lambda q: q.order_index)
    
    if len(answers) != len(questions):
        raise ValueError(f"Expected {len(questions)} answers, got {len(answers)}")
    
    correct_count = 0
    feedback = []
    
    for question, answer in zip(questions, answers):
        is_correct = answer == question.correct_answer
        
        if is_correct:
            correct_count += 1
        
        feedback.append({
            "question": question.question,
            "your_answer": answer,
            "correct_answer": question.correct_answer,
            "correct": is_correct,
            "explanation": question.explanation
        })
    
    score = (correct_count / len(questions) * 100) if questions else 0
    
    result = {
        "score": score,
        "total_questions": len(questions),
        "correct_answers": correct_count,
        "feedback": feedback
    }
    
    logger.info(f"Graded quiz {quiz_id}: {correct_count}/{len(questions)} correct ({score:.1f}%)")
    
    return result
