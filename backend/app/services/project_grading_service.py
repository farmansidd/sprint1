"""
Project Grading Service

Handles project submission validation, storage, and grading pipeline integration
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import (
    ProjectSubmission,
    AutoGradingResult,
    MicroProject,
    TopicCompletion,
    LevelCompletion
)
from datetime import datetime
import os
import re


class ProjectGradingService:
    """Service for project submission and grading coordination"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def validate_github_url(self, url: str) -> bool:
        """Validate GitHub repository URL format"""
        pattern = r'^https?://github\.com/[\w-]+/[\w.-]+/?$'
        return bool(re.match(pattern, url))
    
    async def create_submission(
        self,
        user_id: int,
        roadmap_id: int,
        submission_type: str,
        level_id: Optional[int] = None,
        topic_id: Optional[int] = None,
        github_url: Optional[str] = None,
        file_path: Optional[str] = None,
        micro_project_id: Optional[int] = None,
        skill_id: Optional[int] = None,
        task_id: Optional[str] = None
    ) -> ProjectSubmission:
        """
        Create a project submission record
        
        Args:
            user_id: User submitting the project
            roadmap_id: Roadmap ID
            submission_type: 'github_url' or 'file_upload'
            level_id: Optional Level ID
            topic_id: Optional Topic ID
            github_url: GitHub repository URL (if submission_type is 'github_url')
            file_path: Local file path (if submission_type is 'file_upload')
            micro_project_id: Optional micro-project ID
            
        Returns:
            ProjectSubmission: Created submission record
        """
        # Validate submission type
        if submission_type not in ['github_url', 'file_upload']:
            raise ValueError("submission_type must be 'github_url' or 'file_upload'")
        
        # Validate GitHub URL if applicable
        if submission_type == 'github_url':
            if not github_url:
                raise ValueError("github_url is required for github_url submission type")
            if not self.validate_github_url(github_url):
                raise ValueError("Invalid GitHub URL format")
        
        # Validate file path if applicable
        if submission_type == 'file_upload':
            if not file_path:
                raise ValueError("file_path is required for file_upload submission type")
            if not os.path.exists(file_path):
                raise ValueError("Uploaded file not found")
        
        # Create submission
        submission = ProjectSubmission(
            user_id=user_id,
            roadmap_id=roadmap_id,
            topic_id=topic_id,
            level_id=level_id,
            micro_project_id=micro_project_id,
            skill_id=skill_id,
            task_id=task_id,
            submission_type=submission_type,
            github_url=github_url,
            file_path=file_path,
            status='pending'
        )
        
        self.db.add(submission)
        await self.db.commit()
        await self.db.refresh(submission)
        
        return submission
    
    async def trigger_grading(self, submission_id: int):
        """
        Trigger async grading task for a submission
        """
        # Import orchestration service
        # Import inside method to avoid potential circular dependency issues with app.models
        try:
            from submissions.service import process_submission
        except ImportError:
            # Fallback for path issues
            import sys
            sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
            from submissions.service import process_submission

        # Call the orchestrator
        # This runs Judge -> Coach -> Updates DB AutoGradingResult
        result = await process_submission(self.db, submission_id)
        
        # Post-processing: Update Progress/Badges if passed
        if result and result.status == 'passed':
            stmt = select(ProjectSubmission).where(ProjectSubmission.id == submission_id)
            result_obj = await self.db.execute(stmt)
            submission = result_obj.scalar_one_or_none()
            
            if submission:
                score = result.score
                if submission.topic_id:
                    await self._update_topic_completion(
                        submission.user_id,
                        submission.topic_id,
                        submission.roadmap_id,
                        project_score=score
                    )
                if submission.level_id:
                    await self._update_level_completion(
                        submission.user_id,
                        submission.level_id,
                        submission.roadmap_id,
                        project_score=score
                    )
                # Ensure submission status is synced if process_submission didn't do it (it does, but safe to check)
                if submission.status != 'completed':
                     submission.status = 'completed'
                     await self.db.commit()

    # _create_mock_grading_result removed as it is replaced by real logic

    async def _update_level_completion(
        self,
        user_id: int,
        level_id: int,
        roadmap_id: int,
        project_score: float
    ):
        """Update level completion with project score"""
        
        stmt = select(LevelCompletion).filter(
            LevelCompletion.user_id == user_id,
            LevelCompletion.level_id == level_id,
            LevelCompletion.roadmap_id == roadmap_id
        )
        result = await self.db.execute(stmt)
        completion = result.scalar_one_or_none()
        
        if not completion:
            completion = LevelCompletion(
                user_id=user_id,
                level_id=level_id,
                roadmap_id=roadmap_id,
                project_score=project_score,
                combined_score=project_score
            )
            self.db.add(completion)
        else:
            completion.project_score = project_score
            
            # Recalculate combined score
            quiz_normalized = (completion.quiz_score / 5.0) if completion.quiz_score else 0
            project_normalized = project_score
            
            if completion.quiz_score is not None:
                completion.combined_score = (quiz_normalized * 0.4) + (project_normalized * 0.6)
            else:
                completion.combined_score = project_normalized
        
        # Mark as completed if score >= 70%
        if completion.combined_score >= 0.7:
            completion.completed = True
            if not completion.completed_at:
                completion.completed_at = datetime.now()
        
        await self.db.commit()

    async def _update_topic_completion(
        self,
        user_id: int,
        topic_id: int,
        roadmap_id: int,
        project_score: float
    ):
        """Update topic completion with project score"""
        
        stmt = select(TopicCompletion).filter(
            TopicCompletion.user_id == user_id,
            TopicCompletion.topic_id == topic_id,
            TopicCompletion.roadmap_id == roadmap_id
        )
        result = await self.db.execute(stmt)
        completion = result.scalar_one_or_none()
        
        if not completion:
            completion = TopicCompletion(
                user_id=user_id,
                topic_id=topic_id,
                roadmap_id=roadmap_id,
                project_score=project_score,
                combined_score=project_score,
                attempts_count=1
            )
            self.db.add(completion)
        else:
            completion.project_score = project_score
            completion.attempts_count += 1
            
            # Recalculate combined score
            quiz_normalized = (completion.quiz_score / 5.0) if completion.quiz_score else 0
            project_normalized = project_score
            
            if completion.quiz_score is not None:
                completion.combined_score = (quiz_normalized * 0.4) + (project_normalized * 0.6)
            else:
                completion.combined_score = project_normalized
        
        # Mark as completed if score >= 70%
        if completion.combined_score >= 0.7:
            completion.completed = True
            if not completion.completed_at:
                completion.completed_at = datetime.now()
        
        await self.db.commit()
    
    async def get_submission_status(self, submission_id: int) -> ProjectSubmission:
        """Get submission with grading results if available"""
        stmt = select(ProjectSubmission).filter(
            ProjectSubmission.id == submission_id
        )
        result = await self.db.execute(stmt)
        submission = result.scalar_one_or_none()
        
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")
        
        return submission
    
    async def get_grading_result(self, submission_id: int) -> Optional[AutoGradingResult]:
        """Get grading result for a submission"""
        stmt = select(AutoGradingResult).filter(
            AutoGradingResult.submission_id == submission_id
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_submission(
        self, 
        user_id: int, 
        topic_id: Optional[int] = None, 
        level_id: Optional[int] = None
    ) -> Optional[ProjectSubmission]:
        """Get latest submission for a topic or level"""
        stmt = select(ProjectSubmission).filter(
            ProjectSubmission.user_id == user_id
        )
        
        if topic_id:
            stmt = stmt.filter(ProjectSubmission.topic_id == topic_id)
        if level_id:
            stmt = stmt.filter(ProjectSubmission.level_id == level_id)
            
        # Order by newest first
        stmt = stmt.order_by(ProjectSubmission.submitted_at.desc())
        
        result = await self.db.execute(stmt)
        return result.scalars().first()
