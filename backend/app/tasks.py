from app.celery_worker import celery
from app.database import SessionLocal
from app.services.project_grading_service import ProjectGradingService
from submissions.service import process_submission
import asyncio
import logging
import os

# Configure logging
logger = logging.getLogger(__name__)

# Helper to run async code in sync Celery task
def run_async(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

@celery.task(name="grade_submission")
def grade_submission_task(submission_id: int):
    """
    Celery task to grade a submission asynchronously.
    """
    logger.info(f"🚀 Starting grading task for submission {submission_id}")
    
    # Run the async grading logic
    run_async(perform_grading(submission_id))
    logger.info(f"✅ Grading task finished for {submission_id}")


async def perform_grading(submission_id: int):
    """
    Core grading logic, decoupled from Celery for direct async usage.
    """
    async with SessionLocal() as db:
        grading_service = ProjectGradingService(db)
        
        # Re-using the logic from trigger_grading
        # We call the orchestration service directly
        try:
            logger.info(f"Calling process_submission for {submission_id}")
            result = await process_submission(db, submission_id)
            
            if result:
                logger.info(f"Grading completed. Status: {result.status}, Score: {result.score}")
                
                # Post-processing: Update Progress/Badges if passed
                if result.status == 'passed':
                    # We need to re-fetch submission to get details
                    submission = await grading_service.get_submission_status(submission_id)
                    
                    if submission.topic_id:
                        await grading_service._update_topic_completion(
                            submission.user_id,
                            submission.topic_id,
                            submission.roadmap_id,
                            project_score=result.score
                        )
                    if submission.level_id:
                        await grading_service._update_level_completion(
                            submission.user_id,
                            submission.level_id,
                            submission.roadmap_id,
                            project_score=result.score
                        )
                        
                    # Ensure status is synced
                    if submission.status != 'completed':
                        submission.status = 'completed'
                        await db.commit()
                    
                    # Phase 6: Publish Event
                    try:
                        import json
                        import redis.asyncio as aredis
                        
                        # Use async redis inside the async function
                        r = aredis.from_url(os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"))
                        
                        event = {
                            "user_id": submission.user_id,
                            "type": "grading_complete",
                            "status": "passed",
                            "score": result.score,
                            "submission_id": submission_id
                        }
                        
                        await r.publish("grading_events", json.dumps(event))
                        logger.info(f"📢 Published event to grading_events: {event}")
                        await r.close()

                    except Exception as e:
                        logger.error(f"Failed to publish redis event: {e}")
                        
            else:
                logger.error(f"Grading returned None for submission {submission_id}")
                
        except Exception as e:
            logger.error(f"Error in grading task: {str(e)}")
            # Optionally mark submission as failed in DB
            pass
