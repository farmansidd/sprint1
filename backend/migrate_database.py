#!/usr/bin/env python
"""
Database Migration Helper Script
Helps run the Alembic migration with proper error handling
"""

import sys
import os
import subprocess

def check_alembic_installed():
    """Check if alembic is installed"""
    try:
        import alembic
        print("[OK] Alembic is installed")
        return True
    except ImportError:
        print("[ERROR] Alembic is not installed")
        return False

def install_alembic():
    """Install alembic"""
    print("\nInstalling alembic...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "alembic"])
        print("[OK] Alembic installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to install alembic: {e}")
        return False

def run_migration():
    """Run the database migration"""
    print("\nRunning database migration...")
    try:
        from alembic.config import Config
        from alembic import command
        
        # Load alembic configuration
        alembic_cfg = Config("alembic.ini")
        
        # Run upgrade
        command.upgrade(alembic_cfg, "head")
        
        print("[OK] Migration completed successfully!")
        print("\n" + "="*60)
        print("DATABASE MIGRATION SUCCESSFUL")
        print("="*60)
        print("\nNew tables created:")
        print("  - roadmap_versions")
        print("  - user_skill_levels")
        print("  - learning_pace_metrics")
        print("  - milestones")
        print("  - quizzes")
        print("  - quiz_questions")
        print("  - task_completions")
        print("\nExisting tables enhanced:")
        print("  - roadmaps (added 7 new columns)")
        print("  - skills (added 6 new columns)")
        print("\nYou can now start the backend server:")
        print("  uvicorn app.main:app --reload")
        print("="*60)
        return True
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check DATABASE_URL in .env file")
        print("3. Verify database credentials")
        print("4. Check alembic.ini configuration")
        return False

def main():
    print("="*60)
    print("AI ROADMAP SYSTEM - DATABASE MIGRATION")
    print("="*60)
    print("\nIMPORTANT: Make sure you've activated your virtual environment!")
    print("Windows: .\\venv\\Scripts\\activate")
    print("Linux/Mac: source venv/bin/activate")
    print("="*60)
    
    # Check if we're in the backend directory
    if not os.path.exists("alembic.ini"):
        print("\n[ERROR] alembic.ini not found")
        print("Please run this script from the backend directory:")
        print("  cd backend")
        print("  python migrate_database.py")
        sys.exit(1)
    
    # Check if alembic is installed
    if not check_alembic_installed():
        response = input("\nDo you want to install alembic now? (y/n): ")
        if response.lower() == 'y':
            if not install_alembic():
                sys.exit(1)
        else:
            print("\nPlease install alembic manually:")
            print("  pip install alembic")
            sys.exit(1)
    
    # Run migration
    if run_migration():
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
