# Quick Migration Guide

## Step-by-Step Migration Instructions

### 1. Activate Virtual Environment

**Windows**:
```bash
cd d:\CareerForge.ai-main\backend
.\venv\Scripts\activate
```

**Linux/Mac**:
```bash
cd /path/to/CareerForge.ai-main/backend
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 2. Run Migration

```bash
python migrate_database.py
```

### 3. Expected Output

```
============================================================
AI ROADMAP SYSTEM - DATABASE MIGRATION
============================================================

IMPORTANT: Make sure you've activated your virtual environment!
Windows: .\venv\Scripts\activate
Linux/Mac: source venv/bin/activate
============================================================
[OK] Alembic is installed
[OK] Migration completed successfully!

============================================================
DATABASE MIGRATION SUCCESSFUL
============================================================

New tables created:
  - roadmap_versions
  - user_skill_levels
  - learning_pace_metrics
  - milestones
  - quizzes
  - quiz_questions
  - task_completions

Existing tables enhanced:
  - roadmaps (added 7 new columns)
  - skills (added 6 new columns)

You can now start the backend server:
  uvicorn app.main:app --reload
============================================================
```

### 4. Start Backend Server

```bash
# Make sure you're still in the backend directory with venv activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify

Visit: http://localhost:8000/docs

You should see:
- "Roadmaps Enhanced" tag with 10+ new endpoints
- All existing endpoints still working

## Troubleshooting

### "alembic: command not found" or "No module named 'alembic'"

**Solution**: Install alembic in your virtual environment
```bash
# Make sure venv is activated!
pip install alembic
```

### "No module named 'app'"

**Solution**: Make sure you're in the backend directory
```bash
cd backend
# Then activate venv and run migration
```

### Migration fails with database errors

**Solution**: Check your database connection
1. Make sure PostgreSQL is running
2. Verify `.env` file has correct `DATABASE_URL`
3. Test connection:
   ```bash
   psql -U your_user -d careerforge
   ```

## Quick Commands Reference

```bash
# Complete migration workflow
cd d:\CareerForge.ai-main\backend
.\venv\Scripts\activate
python migrate_database.py
uvicorn app.main:app --reload
```

## Next Steps

After successful migration:
1. Test API endpoints at http://localhost:8000/docs
2. Start frontend: `cd ../Frontendd/my-app && npm run dev`
3. Follow integration guide to update Roadmap.js
