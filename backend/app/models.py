from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, CheckConstraint, DateTime, event, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.encrypted_types import EncryptedString
import hashlib

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(EncryptedString, unique=True, index=True)
    email_hash = Column(String, unique=True, index=True) # For indexing and searching encrypted emails
    hashed_password = Column(String)
    is_email_verified = Column(Boolean, default=False)
    last_active_at = Column(DateTime, nullable=True)
    streak_count = Column(Integer, default=0)
    
    # Career Personality Profiling
    holland_code = Column(String, nullable=True)  # e.g., 'RIA', 'Investigative'
    personality_traits = Column(JSON, nullable=True)  # e.g., {"openness": 0.8, ...}

    roadmaps = relationship("Roadmap", back_populates="owner", lazy="selectin")

# Event listener to hash email before insert/update
@event.listens_for(User.email, 'set')
def receive_email_set(target, value, oldvalue, initiator):
    if value is not None:
        target.email_hash = hashlib.sha256(value.encode()).hexdigest()

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, index=True)
    goal = Column(Text, index=True, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    ai_generated_content = Column(Text, nullable=True)
    
    # New fields for enhancements
    skill_level = Column(String, default="intermediate")  # beginner/intermediate/advanced
    version_number = Column(Integer, default=1)
    parent_version_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    progress_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="roadmaps")
    topics = relationship("Topic", back_populates="roadmap", lazy="selectin")
    versions = relationship("RoadmapVersion", back_populates="roadmap", lazy="selectin")
    milestones = relationship("Milestone", back_populates="roadmap", lazy="selectin")
    levels = relationship("Level", back_populates="roadmap", lazy="selectin", order_by="Level.order_index")

class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    name = Column(String, nullable=False)  # Basics, Fundamentals, Core, Mastery
    order_index = Column(Integer, default=0)
    
    roadmap = relationship("Roadmap", back_populates="levels")
    topics = relationship("Topic", back_populates="level", lazy="selectin", order_by="Topic.order_index")
    quiz = relationship("Quiz", back_populates="level", uselist=False, lazy="selectin")
    micro_project = relationship("MicroProject", back_populates="level", uselist=False, lazy="selectin")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=True)
    order_index = Column(Integer, default=0)

    roadmap = relationship("Roadmap", back_populates="topics")
    level = relationship("Level", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic", lazy="selectin")
    micro_project = relationship("MicroProject", back_populates="topic", uselist=False, lazy="selectin")

class Subtopic(Base):
    __tablename__ = "subtopics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))

    topic = relationship("Topic", back_populates="subtopics")
    skills = relationship("Skill", back_populates="subtopic", lazy="selectin")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    estimated_hours = Column(Integer)
    difficulty = Column(String)  # low/medium/high
    due_date = Column(String, nullable=True)
    status = Column(String, default='not_started')  # not_started/in_progress/completed
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"))
    
    # New fields for enhancements
    execution_profile = Column(String, default='python_basic') # python_basic/python_fastapi/conceptual
    estimated_time_minutes = Column(Integer, nullable=True)
    actual_time_minutes = Column(Integer, nullable=True)
    depends_on = Column(JSON, nullable=True)  # Array of skill IDs
    resources = Column(JSON, nullable=True)  # Array of {title, url}
    phase = Column(String, nullable=True)  # Fundamentals/Applied/Project
    completed_at = Column(DateTime, nullable=True)

    subtopic = relationship("Subtopic", back_populates="skills")
    completions = relationship("TaskCompletion", back_populates="skill", lazy="selectin")

class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, nullable=True)
    skill_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    response_content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User")

    __table_args__ = (
        CheckConstraint("status IN ('completed', 'pending')", name='status_check'),
    )

class TokenBlocklist(Base):
    __tablename__ = "token_blocklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())

class RoadmapVersion(Base):
    __tablename__ = "roadmap_versions"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    version_number = Column(Integer)
    snapshot_data = Column(JSON, nullable=False)  # Full roadmap snapshot
    changes_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    roadmap = relationship("Roadmap", back_populates="versions")

class UserSkillLevel(Base):
    __tablename__ = "user_skill_levels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_level = Column(String, nullable=False)  # beginner/intermediate/advanced
    domain = Column(String, nullable=True)  # e.g., "Python", "Web Development"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")

class LearningPaceMetric(Base):
    __tablename__ = "learning_pace_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    estimated_minutes = Column(Integer)
    actual_minutes = Column(Integer)
    pace_multiplier = Column(Float)  # actual/estimated
    completed_at = Column(DateTime, server_default=func.now())

    user = relationship("User")
    skill = relationship("Skill")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    phase = Column(String, nullable=False)  # Fundamentals/Applied/Project
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    progress = Column(Float, default=0.0)
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)

    roadmap = relationship("Roadmap", back_populates="milestones")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=True)
    
    # Keeping section_id for legacy compatibility if needed, but making it nullable
    section_id = Column(String, nullable=True)  
    section_name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    roadmap = relationship("Roadmap")
    level = relationship("Level", back_populates="quiz")
    questions = relationship("QuizQuestion", back_populates="quiz", lazy="selectin")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # Array of strings
    correct_answer = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")

class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    time_spent_minutes = Column(Integer, nullable=True)

    skill = relationship("Skill", back_populates="completions")
    user = relationship("User")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    # Nullable topic_id, as it might be level based now
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True) 
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float)  # 0-5
    max_score = Column(Integer, default=5)
    answers = Column(JSON)  # User's answers
    attempted_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User")
    topic = relationship("Topic")
    level = relationship("Level") # Add relationship
    roadmap = relationship("Roadmap")
    quiz = relationship("Quiz")

class MicroProject(Base):
    __tablename__ = "micro_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    # Make topic_id nullable
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # New fields for project brief
    requirements = Column(JSON, nullable=True) # List of requirements
    evaluation_criteria = Column(JSON, nullable=True) # List of criteria
    
    test_cases = Column(JSON)  # Hidden test cases
    starter_code = Column(Text, nullable=True)
    execution_profile = Column(String, default='python_basic')
    difficulty = Column(String, default="medium")  # easy/medium/hard
    created_at = Column(DateTime, server_default=func.now())
    
    topic = relationship("Topic", back_populates="micro_project")
    level = relationship("Level", back_populates="micro_project")
    submissions = relationship("ProjectSubmission", back_populates="micro_project")

class ProjectSubmission(Base):
    __tablename__ = "project_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    micro_project_id = Column(Integer, ForeignKey("micro_projects.id"))
    
    # New fields for Event-Driven Architecture
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    task_id = Column(String, nullable=True, index=True) # e.g. "t1", "t2"
    
    submission_type = Column(String)  # 'github_url' or 'file_upload'
    github_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    status = Column(String, default='pending')  # pending/grading/completed/failed
    submitted_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User")
    roadmap = relationship("Roadmap")
    level = relationship("Level")
    topic = relationship("Topic")
    skill = relationship("Skill") # Add relationship
    micro_project = relationship("MicroProject", back_populates="submissions")
    grading_result = relationship("AutoGradingResult", back_populates="submission", uselist=False)

class AutoGradingResult(Base):
    __tablename__ = "auto_grading_results"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("project_submissions.id"), unique=True)
    status = Column(String)  # 'passed' or 'failed'
    score = Column(Float)  # 0-1
    test_results = Column(JSON)  # Individual test case results
    logs = Column(Text)  # Sanitized execution output
    ai_feedback = Column(Text, nullable=True)  # AI Coach explanation
    execution_time_ms = Column(Integer, nullable=True)
    graded_at = Column(DateTime, server_default=func.now())
    
    submission = relationship("ProjectSubmission", back_populates="grading_result")

class TopicCompletion(Base):
    __tablename__ = "topic_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    quiz_score = Column(Float, nullable=True)  # 0-5
    project_score = Column(Float, nullable=True)  # 0-1
    combined_score = Column(Float)  # Weighted average
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    attempts_count = Column(Integer, default=0)
    
    user = relationship("User")
    topic = relationship("Topic")
    roadmap = relationship("Roadmap")

class LevelCompletion(Base):
    __tablename__ = "level_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    level_id = Column(Integer, ForeignKey("levels.id"))
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"))
    quiz_score = Column(Float, nullable=True)  # 0-5
    project_score = Column(Float, nullable=True)  # 0-1
    combined_score = Column(Float)  # Weighted average
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User")
    level = relationship("Level")
    roadmap = relationship("Roadmap")
