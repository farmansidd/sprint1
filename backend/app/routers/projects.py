"""
Projects API Router

Endpoints for project submission and grading
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.project_grading_service import ProjectGradingService
from app.schemas_assessments import (
    ProjectSubmissionRequest,
    ProjectSubmissionResponse,
    ProjectSubmissionResponse,
    GradingResultResponse
)
from app.tasks import perform_grading
import os
import shutil
import logging
import traceback

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/submit", response_model=ProjectSubmissionResponse)
async def submit_project(
    background_tasks: BackgroundTasks,
    roadmap_id: int = Form(...),
    submission_type: str = Form(...),
    level_id: Optional[int] = Form(None),
    topic_id: Optional[int] = Form(None),
    skill_id: Optional[int] = Form(None),
    task_id: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    micro_project_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a project for grading
    
    Supports two submission types:
    - github_url: Submit via GitHub repository URL
    - file_upload: Upload source files (.py, .zip, etc.)
    
    Args:
        roadmap_id: Roadmap ID
        submission_type: 'github_url' or 'file_upload'
        level_id: Optional Level ID
        topic_id: Optional Topic ID
        github_url: GitHub repo URL (if submission_type is github_url)
        file: Uploaded file (if submission_type is file_upload)
        micro_project_id: Optional micro-project ID
        
    Returns:
        Submission record with pending status
    """
    grading_service = ProjectGradingService(db)
    
    file_path = None
    
    # Handle file upload
    if submission_type == 'file_upload':
        if not file:
            raise HTTPException(
                status_code=400,
                detail="File is required for file_upload submission type"
            )
        
        # Validate file extension
        allowed_extensions = ['.py', '.zip', '.tar.gz', '.js', '.java', '.cpp', '.c']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed types: {allowed_extensions}"
            )
            
        # Validate file size (Max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds limit of 10MB. Your file is {file_size / (1024*1024):.2f}MB."
            )
        
        # Save file
        upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(
            upload_dir,
            f"user_{current_user.id}_topic_{topic_id or level_id}_{file.filename}"
        )
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    # Create submission
    try:
        submission = await grading_service.create_submission(
            user_id=current_user.id,
            roadmap_id=roadmap_id,
            topic_id=topic_id,
            level_id=level_id,
            submission_type=submission_type,
            github_url=github_url,
            file_path=file_path,
            micro_project_id=micro_project_id,
            skill_id=skill_id,
            task_id=task_id
        )
        
        # Trigger async grading via BackgroundTasks (no Celery required)
        background_tasks.add_task(perform_grading, submission.id)
        
        return ProjectSubmissionResponse.model_validate(submission)
        
    except ValueError as e:
        # Clean up file if validation failed
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Clean up file on error
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # Log the error with traceback
        logging.error(f"Error submitting project: {str(e)}")
        logging.error(traceback.format_exc())
            
        raise HTTPException(status_code=500, detail=f"Failed to submit project: {str(e)}")


@router.get("/status/{submission_id}", response_model=ProjectSubmissionResponse)
async def get_submission_status(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check grading status of a submission
    
    Args:
        submission_id: Submission to check
        
    Returns:
        Submission with current status (pending/grading/completed/failed)
    """
    grading_service = ProjectGradingService(db)
    
    try:
        submission = await grading_service.get_submission_status(submission_id)
        
        # Verify ownership
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")
        
        return ProjectSubmissionResponse.model_validate(submission)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/results/{submission_id}", response_model=GradingResultResponse)
async def get_grading_results(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed grading results for a completed submission
    
    Args:
        submission_id: Submission to get results for
        
    Returns:
        Grading result with score, test results, and logs
    """
    grading_service = ProjectGradingService(db)
    
    # Check submission ownership
    try:
        submission = await grading_service.get_submission_status(submission_id)
        
        if submission.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")
        
        if submission.status == 'pending':
            raise HTTPException(status_code=400, detail="Submission not yet graded")
        
        result = await grading_service.get_grading_result(submission_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Grading result not found")
        
        return GradingResultResponse.model_validate(result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/latest", response_model=Optional[ProjectSubmissionResponse])
async def get_latest_submission(
    topic_id: Optional[int] = None,
    level_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the latest submission for a topic or level
    """
    grading_service = ProjectGradingService(db)
    submission = await grading_service.get_latest_submission(current_user.id, topic_id, level_id)
    
    if not submission:
        return None
        
    return ProjectSubmissionResponse.model_validate(submission)
