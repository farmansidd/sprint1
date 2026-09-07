from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict
from datetime import datetime

class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None # Added description
    estimated_hours: int
    difficulty: str

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: int
    status: str
    subtopic_id: int
    execution_profile: Optional[str] = 'python_basic'

    @field_validator('execution_profile', mode='before')
    def set_default_profile(cls, v):
        return v or 'python_basic'

    class Config:
        from_attributes = True

class SkillStatusUpdate(BaseModel):
    status: str

class SubtopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class SubtopicCreate(SubtopicBase):
    pass

class Subtopic(SubtopicBase):
    id: int
    topic_id: int
    skills: List[Skill] = []

    class Config:
        from_attributes = True

class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class MicroProject(BaseModel):
    id: int
    title: str
    description: str
    requirements: Optional[List[str]] = None
    evaluation_criteria: Optional[List[str]] = None
    starter_code: Optional[str] = None
    execution_profile: Optional[str] = 'python_basic'
    difficulty: str

    @field_validator('execution_profile', mode='before')
    def set_default_profile(cls, v):
        return v or 'python_basic'

    class Config:
        from_attributes = True

class Topic(TopicBase):
    id: int
    roadmap_id: int
    subtopics: List[Subtopic] = []
    micro_project: Optional[MicroProject] = None # Add micro_project

    class Config:
        from_attributes = True

class RoadmapBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal: Optional[str] = None

class RoadmapCreate(RoadmapBase):
    pass

class Roadmap(RoadmapBase):
    id: int
    owner_id: int
    topics: List[Topic] = []
    levels: List["Level"] = [] # Add levels

    class Config:
        from_attributes = True

class Level(BaseModel):
    id: int
    name: str # Basics, Fundamentals, Core, Mastery
    order_index: int = 0
    topics: List[Topic] = []
    quiz: Optional["QuizSchema"] = None
    micro_project: Optional["MicroProject"] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_email_verified: bool
    streak_count: Optional[int] = 0
    holland_code: Optional[str] = None
    personality_traits: Optional[Dict[str, float]] = None
    roadmaps: List[Roadmap] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class RoadmapGenerate(BaseModel):
    goal: str
    skill_level: str = "intermediate"  # beginner/intermediate/advanced
    weekly_hours: int = 10

# Schema for AI-generated roadmap input
class AIGeneratedSkill(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    estimated_hours: int
    estimated_time_minutes: Optional[int] = None
    difficulty: str  # low/medium/high
    depends_on: Optional[List[str]] = []  # Task IDs
    resources: Optional[List[dict]] = []  # [{"title": str, "url": str}]
    status: str = "not_started"

class AIGeneratedSubtopic(BaseModel):
    name: str
    description: Optional[str] = None
    skills: List[AIGeneratedSkill]

class AIGeneratedMicroProject(BaseModel):
    title: str
    description: str
    requirements: List[str]
    evaluation_criteria: List[str]
    starter_code: Optional[str] = None

class AIGeneratedTopic(BaseModel):
    name: str
    description: Optional[str] = None
    subtopics: List[AIGeneratedSubtopic]
    micro_project: Optional[AIGeneratedMicroProject] = None

class AIGeneratedQuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None

class AIGeneratedQuiz(BaseModel):
    questions: List[AIGeneratedQuizQuestion]

class AIGeneratedLevel(BaseModel):
    name: str
    topics: List[AIGeneratedTopic]
    quiz: Optional[AIGeneratedQuiz] = None
    micro_project: Optional[AIGeneratedMicroProject] = None

class AIGeneratedRoadmap(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    progress_percent: float = 0.0
    summary: Optional[str] = None
    levels: List[AIGeneratedLevel]

class AIRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

class AIResponse(BaseModel):
    response_content: str

class SkillResponse(BaseModel):
    skill_id: int
    name: str
    category: str
    difficulty: str
    status: str
    due_date: Optional[str] = None

class DashboardStats(BaseModel):
    total_skills: int
    completed_skills: int
    pending_skills: int
    not_started_skills: int
    progress_percent: float

class RoadmapProgress(BaseModel):
    id: int
    title: str
    progress: float
    total_skills: int
    completed_skills: int

class RoadmapProgress(BaseModel):
    id: int
    title: str
    progress: float
    total_skills: int
    completed_skills: int

class DashboardResponse(BaseModel):
    user_id: int
    username: str
    roadmaps: List[RoadmapProgress]
    dashboard_stats: DashboardStats
    skills: List[SkillResponse]

class RoadmapRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

class RoadmapResponse(BaseModel):
    roadmap_data: dict

class TokenWithUser(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: User

# New schemas for enhanced features
class TaskStatusUpdate(BaseModel):
    status: str  # not_started/in_progress/completed

class RoadmapVersionBase(BaseModel):
    version_number: int
    changes_summary: Optional[str] = None

class RoadmapVersionCreate(RoadmapVersionBase):
    roadmap_id: int
    snapshot_data: dict

class RoadmapVersionSchema(RoadmapVersionBase):
    id: int
    roadmap_id: int
    snapshot_data: dict
    created_at: str

    class Config:
        from_attributes = True

class LearningAnalytics(BaseModel):
    weekly_completion_rate: float
    projected_completion_date: Optional[str] = None
    bottleneck_topics: List[str] = []
    difficulty_heatmap: dict = {}
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    not_started_tasks: int

class MilestoneBase(BaseModel):
    phase: str
    name: str
    description: Optional[str] = None
    order_index: int = 0

class MilestoneCreate(MilestoneBase):
    roadmap_id: int

class MilestoneSchema(MilestoneBase):
    id: int
    roadmap_id: int
    progress: float
    total_tasks: int
    completed_tasks: int

    class Config:
        from_attributes = True

class QuizQuestionBase(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    order_index: int = 0

class QuizQuestionCreate(QuizQuestionBase):
    quiz_id: int

class QuizQuestionSchema(QuizQuestionBase):
    id: int
    quiz_id: int

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    section_id: Optional[str] = None
    section_name: Optional[str] = None

class QuizCreate(QuizBase):
    roadmap_id: int
    questions: List[QuizQuestionBase]

class QuizSchema(QuizBase):
    id: int
    roadmap_id: Optional[int] = None
    created_at: Optional[datetime] = None
    questions: List[QuizQuestionSchema] = []

    class Config:
        from_attributes = True

class QuizSubmission(BaseModel):
    answers: List[str]  # User's answers in order

class QuizResult(BaseModel):
    score: float  # Percentage
    total_questions: int
    correct_answers: int
    feedback: List[dict]  # [{"question": str, "correct": bool, "explanation": str}]

class TimeForecasting(BaseModel):
    projected_completion_date: Optional[str] = None
    weekly_goal_minutes: int
    pace_multiplier: float  # User's actual pace vs estimated
    estimated_weeks_remaining: float
    confidence_level: str  # low/medium/high

class UserSkillLevelBase(BaseModel):
    skill_level: str
    domain: Optional[str] = None

class UserSkillLevelCreate(UserSkillLevelBase):
    user_id: int

class UserSkillLevelSchema(UserSkillLevelBase):
    id: int
    user_id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

__all__ = [
    "Skill",
    "SkillCreate",
    "SkillStatusUpdate",
    "Subtopic",
    "SubtopicCreate",
    "Topic",
    "TopicCreate",
    "Roadmap",
    "RoadmapCreate",
    "User",
    "UserCreate",
    "Token",
    "TokenData",
    "RoadmapGenerate",
    "AIGeneratedSkill",
    "AIGeneratedSubtopic",
    "AIGeneratedTopic",
    "AIGeneratedRoadmap",
    "AIRequest",
    "AIResponse",
    "SkillResponse",
    "DashboardStats",
    "DashboardResponse",
    "RoadmapRequest",
    "RoadmapResponse",
    "TokenWithUser",
    "TaskStatusUpdate",
    "RoadmapVersionSchema",
    "RoadmapVersionCreate",
    "LearningAnalytics",
    "MilestoneSchema",
    "MilestoneCreate",
    "QuizSchema",
    "QuizCreate",
    "QuizQuestionSchema",
    "QuizSubmission",
    "QuizResult",
    "TimeForecasting",
    "UserSkillLevelSchema",
    "UserSkillLevelCreate",
]
