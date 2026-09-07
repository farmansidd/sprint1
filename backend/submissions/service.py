

from sqlalchemy.orm import Session, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import ProjectSubmission, AutoGradingResult, TaskCompletion
from judge.docker_runner import run_judge
from coach.ai_feedback import generate_feedback
from intelligence.velocity.service import update_learning_state
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def process_submission(db: AsyncSession, submission_id: int):
    """
    Orchestrates Judge → Coach.
    This is the ONLY place where flow is defined.
    """
    
    # 1. Fetch Submission
    stmt = select(ProjectSubmission).options(
        selectinload(ProjectSubmission.micro_project),
        selectinload(ProjectSubmission.skill)
    ).where(ProjectSubmission.id == submission_id)
    result = await db.execute(stmt)
    submission = result.scalar_one_or_none()
    
    if not submission:
        logger.error(f"Submission {submission_id} not found")
        return None

    # Determine execution profile
    execution_profile = 'python_basic'
    
    # Auto-detect from file extension if file upload
    if submission.submission_type == 'file_upload' and submission.file_path:
        if submission.file_path.endswith('.js'):
            execution_profile = 'node_basic'
    
    # Override with configured profile if specific (but file type check is strong hint)
    if submission.micro_project:
        # Only override if micro_project specifies and it's not generic
        if submission.micro_project.execution_profile != 'python_basic':
            execution_profile = submission.micro_project.execution_profile
            
    elif submission.skill:
         if submission.skill.execution_profile != 'python_basic':
            execution_profile = submission.skill.execution_profile

    # Update status to running
    submission.status = 'grading'
    await db.commit()

    # 2. Prepare Code
    user_code = ""
    try:
        if submission.submission_type == 'file_upload' and submission.file_path:
             if os.path.exists(submission.file_path):
                 with open(submission.file_path, 'r', encoding='utf-8') as f:
                     user_code = f.read()
             else:
                 raise FileNotFoundError(f"File not found: {submission.file_path}")
        elif submission.submission_type == 'github_url':
            # Placeholder for GitHub cloning
            # For now, we unfortunately can't judge a URL without cloning.
            # We'll fail it or use a mockup if empty.
            user_code = "# GitHub cloning not yet implemented. Please upload file."
        else:
             user_code = "# No code found."
             
    except Exception as e:
        logger.error(f"Failed to read code: {e}")
        # Log error in result
        result = AutoGradingResult(
            submission_id=submission_id,
            status='failed',
            score=0.0,
            logs=f"System Error reading code: {str(e)}"
        )
        db.add(result)
        submission.status = 'failed'
        await db.commit()
        return

    # 3. Step 1: Judge (Docker)
    # This is blocking for now, ideally offloaded to thread/worker
    logger.info(f"Running Judge for submission {submission_id} with profile {execution_profile}")
    
    # Determine filename
    filename = "main.py"
    if submission.submission_type == 'file_upload' and submission.file_path:
        filename = os.path.basename(submission.file_path)
    elif execution_profile == 'node_basic':
        filename = "main.js"

    try:
        judge_result = run_judge(str(submission_id), user_code, execution_profile=execution_profile, filename=filename)
    except Exception as e:
        logger.error(f"Critical error running Judge for submission {submission_id}: {e}")
        judge_result = {
            "status": "ERROR",
            "stderr": f"System Error: Judge failed to execute. {str(e)}",
            "stdout": ""
        }
    
    # Map Judge Status to DB Status
    db_status = 'passed' if judge_result["status"] == "PASSED" else 'failed'
    score = 1.0 if db_status == 'passed' else 0.0
    
    # Create Grading Result
    grading_result = AutoGradingResult(
        submission_id=submission_id,
        status=db_status,
        score=score,
        logs=judge_result.get("stdout", "") + "\n" + judge_result.get("stderr", ""),
        test_results={}, # Can parse if needed
        execution_time_ms=0 # TODO: Measure time
    )
    db.add(grading_result)
    
    
    if db_status == 'passed':
        submission.status = 'completed'
        
        # 5. Case A — PASSED: Emit Task Completion Event
        # This is the "Hard Gate" and "Spine" of the system.
        logger.info(f"Submission {submission_id} PASSED. Emitting TaskCompletion event.")
        
        if submission.skill_id:
            task_completion = TaskCompletion(
                user_id=submission.user_id,
                skill_id=submission.skill_id,
                started_at=submission.submitted_at, # Approximate
                completed_at=datetime.utcnow(), # Now
                time_spent_minutes=0 
            )
            db.add(task_completion)
            logger.info(f"TaskCompletion event created for skill {submission.skill_id}")
            
        else:
            logger.warning(f"Submission {submission_id} PASSED but no skill_id linked. TaskCompletion not emitted.")

    else:
        submission.status = 'failed'
        
        # 4. Step 2: Coach (AI) - ONLY if Failed
        logger.info(f"Judge Failed. Calling AI Coach for submission {submission_id}")
        
        # Fetch Context (Phase 2 Upgrade)
        try:
            state = await update_learning_state(submission.user_id, db)
            velocity = state.current_velocity_band
            mastery = state.mastery_level
        except Exception as e:
            logger.warning(f"Failed to fetch learning state for coach context: {e}")
            velocity = "UNKNOWN"
            mastery = "UNKNOWN"

        ai_response = await generate_feedback(
            user_code=user_code,
            error_logs=judge_result.get("stderr", ""),
            velocity=velocity,
            mastery=mastery
        )
        
        # LOGGING FEEDBACK FOR DEBUGGING
        logger.info(f"AI Coach Generated Feedback (Length: {len(ai_response)} chars):")
        logger.info(ai_response[:500] + "..." if len(ai_response) > 500 else ai_response)
        
        grading_result.ai_feedback = ai_response
        
    await db.commit()
    
    return grading_result
