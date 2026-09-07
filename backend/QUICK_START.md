# Quick Start Guide - AI Roadmap System

## Prerequisites
- Python 3.8+
- PostgreSQL database
- Redis (optional, for caching)
- Google API key (for Gemini AI)

## Setup Steps

### 1. Environment Configuration

Create `.env` file in `backend/` directory:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/careerforge
SECRET_KEY=your-secret-key-here
GOOGLE_API_KEY=your-google-api-key
CORS_ORIGINS=http://localhost:3000,http://localhost
ENCRYPTION_KEY=your-encryption-key

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Email settings
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Run Database Migration

```bash
# Create new migration (if needed)
python -m alembic revision --autogenerate -m "add roadmap enhancements"

# Apply migration
python -m alembic upgrade head
```

### 4. Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify Installation

Visit: `http://localhost:8000/docs` for interactive API documentation

## Testing the Enhanced Features

### 1. Register and Login

```bash
# Register
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=Test123!"
```

Save the `access_token` from the response.

### 2. Generate Roadmap with Skill Level

```bash
curl -X POST "http://localhost:8000/api/v1/roadmaps/generate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Python Full-Stack Developer",
    "skill_level": "intermediate",
    "weekly_hours": 10
  }'
```

### 3. Update Task Status

```bash
curl -X POST "http://localhost:8000/api/v1/roadmaps/tasks/1/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### 4. Get Analytics

```bash
curl -X GET "http://localhost:8000/api/v1/roadmaps/1/analytics?weekly_hours=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Get Milestones

```bash
curl -X GET "http://localhost:8000/api/v1/roadmaps/1/milestones" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Get Time Forecast

```bash
curl -X GET "http://localhost:8000/api/v1/roadmaps/1/forecast?weekly_hours=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Frontend Setup (Next.js)

### 1. Install Dependencies

```bash
cd Frontendd/my-app
npm install
```

### 2. Configure API URL

Update `lib/axios.js` to point to backend:

```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3. Start Frontend

```bash
npm run dev
```

Visit: `http://localhost:3000`

## Troubleshooting

### Migration Errors

If you encounter migration errors:

```bash
# Check current migration status
python -m alembic current

# Downgrade one version
python -m alembic downgrade -1

# Upgrade again
python -m alembic upgrade head
```

### Import Errors

If you see import errors for new modules:

```bash
# Restart the server
# Make sure all new files are in the correct directories
```

### Database Connection Issues

Check PostgreSQL is running:

```bash
# Windows
net start postgresql

# Linux/Mac
sudo service postgresql start
```

## Key Files Reference

### Backend
- `app/models.py` - Database models (7 new tables)
- `app/schemas.py` - Pydantic schemas (10+ new schemas)
- `app/crud_enhanced.py` - Enhanced CRUD operations
- `app/routers/roadmaps_enhanced.py` - New API endpoints
- `app/services/ai_model_selector.py` - Multi-model orchestration
- `app/services/learning_analytics.py` - Analytics computation
- `app/services/time_forecasting.py` - Completion predictions

### Frontend (To be updated)
- `app/Pages/Roadmaps/Roadmap.js` - Main roadmap component
- `context/AuthContext.js` - Authentication context
- `lib/axios.js` - API client

## Next Steps

1. ✅ Backend is complete and ready
2. ⏳ Run database migration
3. ⏳ Test API endpoints
4. ⏳ Update frontend to use new APIs
5. ⏳ Add UI components for new features

## Support

For issues or questions, refer to:
- API Documentation: `http://localhost:8000/docs`
- Implementation Plan: `implementation_plan.md`
- Walkthrough: `walkthrough.md`
