from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete
import app.models as models
import app.schemas as schemas
from app.core.security import get_password_hash
import hashlib
import logging

logger = logging.getLogger(__name__)

async def get_user_by_email(db: AsyncSession, email: str):
    email_hash = hashlib.sha256(email.encode()).hexdigest()
    result = await db.execute(select(models.User).filter(models.User.email_hash == email_hash))
    return result.scalars().first()

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(models.User).filter(models.User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    # Explicitly set email_hash to ensure it's saved, as event listeners can sometimes be unreliable depending on session state
    email_hash = hashlib.sha256(user.email.encode()).hexdigest()
    db_user = models.User(
        email=user.email, 
        username=user.username, 
        hashed_password=hashed_password, 
        is_email_verified=False,
        email_hash=email_hash
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info(f"User created: {db_user.email} (ID: {db_user.id})")
    return db_user

async def set_user_email_verified(db: AsyncSession, user: models.User):
    user.is_email_verified = True
    await db.commit()
    await db.refresh(user)
    logger.info(f"User email verified: {user.email} (ID: {user.id})")
    return user

async def delete_user_data(db: AsyncSession, user_id: int):
    # Delete AI responses associated with the user
    await db.execute(delete(models.AIResponse).where(models.AIResponse.user_id == user_id))
    # Delete roadmaps associated with the user (this should cascade delete topics, subtopics, skills)
    await db.execute(delete(models.Roadmap).where(models.Roadmap.owner_id == user_id))
    # Delete the user
    user = await get_user_by_id(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()
        logger.info(f"User and associated data deleted for user ID: {user_id}")
        return True
    return False

async def get_roadmap(db: AsyncSession, roadmap_id: int):
    try:
        result = await db.execute(
            select(models.Roadmap)
            .options(
                selectinload(models.Roadmap.levels)
                .selectinload(models.Level.topics)
                .selectinload(models.Topic.subtopics)
                .selectinload(models.Subtopic.skills),
                selectinload(models.Roadmap.levels).selectinload(models.Level.topics).selectinload(models.Topic.micro_project),
                selectinload(models.Roadmap.levels).selectinload(models.Level.quiz),
                selectinload(models.Roadmap.levels).selectinload(models.Level.micro_project)
            )
            .filter(models.Roadmap.id == roadmap_id)
        )
        return result.scalars().first()
    except Exception as e:
        logger.error(f"Error getting roadmap by ID: {e}")
        raise e

async def get_roadmaps_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(models.Roadmap)
        .options(
            selectinload(models.Roadmap.levels)
            .selectinload(models.Level.topics)
            .selectinload(models.Topic.subtopics)
            .selectinload(models.Subtopic.skills),
            selectinload(models.Roadmap.levels).selectinload(models.Level.topics).selectinload(models.Topic.micro_project),
            selectinload(models.Roadmap.levels).selectinload(models.Level.quiz),
            selectinload(models.Roadmap.levels).selectinload(models.Level.micro_project)
        )
        .filter(models.Roadmap.owner_id == user_id)
    )
    return result.scalars().all()

async def get_all_roadmaps(db: AsyncSession):
    result = await db.execute(
        select(models.Roadmap)
        .options(selectinload(models.Roadmap.topics).selectinload(models.Topic.subtopics).selectinload(models.Subtopic.skills))
    )
    return result.scalars().all()

async def create_roadmap(db: AsyncSession, roadmap: schemas.RoadmapCreate, user_id: int):
    db_roadmap = models.Roadmap(**roadmap.dict(), owner_id=user_id)
    db.add(db_roadmap)
    await db.commit()
    await db.refresh(db_roadmap)
    return db_roadmap

async def create_topic(db: AsyncSession, topic: schemas.TopicCreate, roadmap_id: int):
    db_topic = models.Topic(**topic.dict(), roadmap_id=roadmap_id)
    db.add(db_topic)
    await db.commit()
    await db.refresh(db_topic)
    return db_topic

async def get_topic(db: AsyncSession, topic_id: int):
    result = await db.execute(
        select(models.Topic)
        .options(selectinload(models.Topic.subtopics).selectinload(models.Subtopic.skills))
        .filter(models.Topic.id == topic_id)
    )
    return result.scalars().first()

async def get_topics_by_roadmap(db: AsyncSession, roadmap_id: int):
    result = await db.execute(select(models.Topic).filter(models.Topic.roadmap_id == roadmap_id))
    return result.scalars().all()

async def create_subtopic(db: AsyncSession, subtopic: schemas.SubtopicCreate, topic_id: int):
    db_subtopic = models.Subtopic(**subtopic.dict(), topic_id=topic_id)
    db.add(db_subtopic)
    await db.commit()
    await db.refresh(db_subtopic)
    return db_subtopic

async def get_subtopic(db: AsyncSession, subtopic_id: int):
    result = await db.execute(
        select(models.Subtopic)
        .options(selectinload(models.Subtopic.skills))
        .filter(models.Subtopic.id == subtopic_id)
    )
    return result.scalars().first()

async def get_subtopics_by_topic(db: AsyncSession, topic_id: int):
    result = await db.execute(select(models.Subtopic).filter(models.Subtopic.topic_id == topic_id))
    return result.scalars().all()

async def create_skill(db: AsyncSession, skill: schemas.SkillCreate, subtopic_id: int):
    db_skill = models.Skill(**skill.dict(), subtopic_id=subtopic_id)
    db.add(db_skill)
    await db.commit()
    await db.refresh(db_skill)
    return db_skill

async def get_skill(db: AsyncSession, skill_id: int):
    result = await db.execute(select(models.Skill).filter(models.Skill.id == skill_id))
    return result.scalars().first()

async def get_skill_for_user(db: AsyncSession, skill_id: int, user_id: int):
    result = await db.execute(
        select(models.Skill)
        .join(models.Subtopic)
        .join(models.Topic)
        .join(models.Roadmap)
        .filter(models.Skill.id == skill_id, models.Roadmap.owner_id == user_id)
    )
    return result.scalars().first()

async def update_skill(db: AsyncSession, skill_id: int, skill: schemas.SkillCreate):
    db_skill = await get_skill(db, skill_id)
    if db_skill:
        for key, value in skill.dict(exclude_unset=True).items():
            setattr(db_skill, key, value)
        await db.commit()
        await db.refresh(db_skill)
    return db_skill

async def update_skill_status(db: AsyncSession, skill_id: int, status: str):
    db_skill = await get_skill(db, skill_id)
    if db_skill:
        db_skill.status = status
        await db.commit()
        await db.refresh(db_skill)
    return db_skill

async def delete_skill(db: AsyncSession, skill_id: int):
    db_skill = await get_skill(db, skill_id)
    if db_skill:
        await db.delete(db_skill)
        await db.commit()
    return db_skill

async def create_full_roadmap_from_ai(db: AsyncSession, ai_roadmap_data: schemas.AIGeneratedRoadmap, user_id: int, goal: str, ai_generated_content: str):
    logger.info("Creating full roadmap from AI")
    
    # Create the object graph in memory
    # Create the object graph in memory
    db_roadmap = models.Roadmap(
        title=ai_roadmap_data.title,
        description=ai_roadmap_data.description,
        owner_id=user_id,
        goal=goal,
        ai_generated_content=ai_generated_content,
        levels=[]
    )

    for i, level_data in enumerate(ai_roadmap_data.levels):
        db_level = models.Level(
            name=level_data.name,
            order_index=i,
            topics=[],
        )
        db_roadmap.levels.append(db_level)

        # Add Topics to Level
        for j, topic_data in enumerate(level_data.topics):
            db_topic = models.Topic(
                name=topic_data.name,
                description=topic_data.description,
                order_index=j,
                roadmap=db_roadmap,
                subtopics=[]
            )
            db_level.topics.append(db_topic)

            for subtopic_data in topic_data.subtopics:
                db_subtopic = models.Subtopic(
                    name=subtopic_data.name,
                    description=subtopic_data.description,
                    skills=[]
                )
                db_topic.subtopics.append(db_subtopic)

                for skill_data in subtopic_data.skills:
                    category = skill_data.description or skill_data.name or "General"
                    db_skill = models.Skill(
                        name=skill_data.name,
                        category=category,
                        estimated_hours=skill_data.estimated_hours,
                        difficulty=skill_data.difficulty,
                        status="not_started"
                    )
                    db_subtopic.skills.append(db_skill)
            
            # Add MicroProject to Topic
            if topic_data.micro_project:
                db_topic_project = models.MicroProject(
                    title=topic_data.micro_project.title,
                    description=topic_data.micro_project.description,
                    requirements=topic_data.micro_project.requirements,
                    evaluation_criteria=topic_data.micro_project.evaluation_criteria,
                    starter_code=topic_data.micro_project.starter_code,
                    difficulty="medium"
                )
                db_topic.micro_project = db_topic_project

        # Add Quiz to Level
        if level_data.quiz:
            db_quiz = models.Quiz(
                section_name=f"{level_data.name} Quiz",
                questions=[]
            )
            db_level.quiz = db_quiz
            
            for k, q_data in enumerate(level_data.quiz.questions):
                db_question = models.QuizQuestion(
                    question=q_data.question,
                    options=q_data.options,
                    correct_answer=q_data.correct_answer,
                    explanation=q_data.explanation,
                    order_index=k
                )
                db_quiz.questions.append(db_question)

        # Add MicroProject to Level
        if level_data.micro_project:
            db_project = models.MicroProject(
                title=level_data.micro_project.title,
                description=level_data.micro_project.description,
                requirements=level_data.micro_project.requirements,
                evaluation_criteria=level_data.micro_project.evaluation_criteria,
                starter_code=level_data.micro_project.starter_code,
                difficulty="medium" # Default or derived
            )
            db_level.micro_project = db_project

    db.add(db_roadmap)
    await db.flush()  # Flush to get the ID for db_roadmap
    
    roadmap_id = db_roadmap.id # Safely access the ID

    await db.commit() # Commit the transaction
    logger.info("Roadmap committed")

    # Re-fetch the roadmap to ensure all relationships are loaded
    refreshed_roadmap = await get_roadmap(db, roadmap_id)
    logger.info(f"Roadmap re-fetched with ID: {refreshed_roadmap.id if refreshed_roadmap else 'None'}")
    return refreshed_roadmap

async def add_jti_to_blocklist(db: AsyncSession, jti: str):
    db_jti = models.TokenBlocklist(jti=jti)
    db.add(db_jti)
    await db.commit()
    await db.refresh(db_jti)
    return db_jti

async def is_jti_blocklisted(db: AsyncSession, jti: str):
    result = await db.execute(select(models.TokenBlocklist).filter(models.TokenBlocklist.jti == jti))
    return result.scalars().first() is not None

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    return result.scalars().first()

