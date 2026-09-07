
import asyncio
import os
import sys
import argparse
from datetime import datetime, timedelta

# Ensure we can import app modules
sys.path.append(os.getcwd())

from sqlalchemy import select
from app.database import SessionLocal
from app.models import User, Skill, TaskCompletion, ProjectSubmission, AutoGradingResult, TopicCompletion
from intelligence.velocity.service import update_learning_state

async def seed_velocity(username: str, mode: str):
    async with SessionLocal() as db:
        print(f"--- Seeding Velocity for User: {username} ---")
        
        # 1. Find User
        stmt = select(User).where(User.username == username)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found. Please register/login first.")
            return

        print(f"✅ Found User ID: {user.id}")
        
        # 2. Clear recent history to reset
        # (Optional, but helps with deterministic testing)
        # For now, we just add on top.
        
        # 3. Seed Data based on Mode
        if mode.upper() == "FAST":
            print("🚀 mode: Injecting 10 tasks in last 7 days...")
            # 10 tasks in 1 week -> > 5 tasks/week -> FAST
            for i in range(10):
                tc = TaskCompletion(
                    user_id=user.id,
                    skill_id=1, 
                    completed_at=datetime.utcnow() - timedelta(days=i), 
                    time_spent_minutes=45
                )
                db.add(tc)
                
        elif mode.upper() == "STALLED":
             print("🐢 mode: Ensuring no recent activity (Manual step: You might need to delete old data manually if you have been very active)")
             print("Injecting 1 task 25 days ago...")
             tc = TaskCompletion(
                    user_id=user.id,
                    skill_id=1, 
                    completed_at=datetime.utcnow() - timedelta(days=25), 
                    time_spent_minutes=45
                )
             db.add(tc)
             
        elif mode.upper() == "NORMAL":
             print("🚶 mode: Injecting 3 tasks in last 7 days...")
             for i in range(3):
                tc = TaskCompletion(
                    user_id=user.id,
                    skill_id=1, 
                    completed_at=datetime.utcnow() - timedelta(days=i), 
                    time_spent_minutes=45
                )
                db.add(tc)

        # Inject Mock Quiz Scores if FAST
        if mode.upper() == "FAST":
            print("🧠 mode: Injecting 3 perfect quiz scores...")
            # Assume topic_ids 1, 2, 3 exist
            for i in range(1, 4):
                # Check or create
                stmt = select(TopicCompletion).where(TopicCompletion.user_id == user.id, TopicCompletion.topic_id == i)
                tc_res = await db.execute(stmt)
                if not tc_res.scalar_one_or_none():
                     new_tc = TopicCompletion(
                         user_id=user.id, topic_id=i, roadmap_id=1, quiz_score=5.0, attempts_count=1
                     )
                     db.add(new_tc)

        await db.commit()
        print("✅ Data Seeded.")
        
        # 4. Trigger Recalculation (Simulating the API call)
        print("🔄 Recalculating State...")
        state = await update_learning_state(user.id, db)
        print(f"✅ New Velocity Band: {state.current_velocity_band}")
        print(f"✅ Tasks/Week: {state.avg_tasks_per_week:.2f}")
        print(f"✅ Mastery Level: {state.mastery_level} (Score: {state.mastery_score:.2f})")
        print(f"   - Project Avg: {state.project_average:.1f}%")
        print(f"   - Quiz Avg: {state.quiz_average:.1f}%")
        print(f"✅ Recommended Next Task: {state.next_recommended_task_id}")
        print("\n👉 Now refresh your Dashboard to see these changes!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    parser = argparse.ArgumentParser(description="Seed velocity data for manual testing.")
    parser.add_argument("username", type=str, help="Username to seed data for")
    parser.add_argument("mode", type=str, choices=["FAST", "NORMAL", "STALLED"], help="Target velocity band")
    
    args = parser.parse_args()
    
    asyncio.run(seed_velocity(args.username, args.mode))
