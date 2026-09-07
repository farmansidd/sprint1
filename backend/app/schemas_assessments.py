"""
Pydantic schemas for quiz and project assessment endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


# Quiz Schemas
class QuizQuestionSchema(BaseModel):
    id: int
    question: str
    options: List[str]
    order_index: int
    
    class Config:
        from_attributes = True


class QuizSchema(BaseModel):
    id: int
    section_name: str
    questions: List[QuizQuestionSchema]
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuizAnswerSubmission(BaseModel):
    answers: Dict[int, str] = Field(..., description="Map of question_id to answer (e.g., 'A', 'B', etc.)")


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    score: float
    max_score: int
    attempted_at: datetime
    
    class Config:
        from_attributes = True


# Project Submission Schemas
class ProjectSubmissionRequest(BaseModel):
    topic_id: int
    roadmap_id: int
    micro_project_id: Optional[int] = None
    submission_type: str = Field(..., description="'github_url' or 'file_upload'")
    github_url: Optional[str] = None


class ProjectSubmissionResponse(BaseModel):
    id: int
    topic_id: int
    status: str
    submission_type: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True


class GradingResultResponse(BaseModel):
    id: int
    submission_id: int
    status: str  # 'passed' or 'failed'
    score: float
    test_results: Dict
    logs: str
    ai_feedback: Optional[str] = None
    execution_time_ms: Optional[int]
    graded_at: datetime
    
    class Config:
        from_attributes = True


# Topic Completion Schemas
class TopicCompletionResponse(BaseModel):
    id: int
    topic_id: int
    quiz_score: Optional[float]
    project_score: Optional[float]
    combined_score: float
    completed: bool
    completed_at: Optional[datetime]
    attempts_count: int
    
    class Config:
        from_attributes = True

class LevelCompletionResponse(BaseModel):
    id: int
    level_id: int
    quiz_score: Optional[float]
    project_score: Optional[float]
    combined_score: float
    completed: bool
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True
