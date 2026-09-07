# AI Roadmap System - API Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

---

## Enhanced Roadmap Generation

### Generate Roadmap with Skill Level
**POST** `/roadmaps/generate`

**Request Body**:
```json
{
  "goal": "Python Full-Stack Developer",
  "skill_level": "intermediate",
  "weekly_hours": 10
}
```

**Response**: Full roadmap object with topics, subtopics, and skills

---

## Task Management

### Update Task Status
**POST** `/roadmaps/tasks/{skill_id}/status`

**Request Body**:
```json
{
  "status": "completed"
}
```

**Response**:
```json
{
  "id": 123,
  "status": "completed",
  "updated_at": "2025-12-11T22:00:00Z"
}
```

---

## Versioning

### Get All Versions
**GET** `/roadmaps/{roadmap_id}/versions`

**Response**: Array of version objects with snapshots

### Create New Version
**POST** `/roadmaps/{roadmap_id}/versions?changes_summary=Completed%20Phase%201`

**Response**: New version object

---

## Analytics

### Get Learning Analytics
**GET** `/roadmaps/{roadmap_id}/analytics?weekly_hours=10`

**Response**:
```json
{
  "weekly_completion_rate": 2.5,
  "projected_completion_date": "2026-03-15T00:00:00Z",
  "bottleneck_topics": ["Advanced React Patterns"],
  "difficulty_heatmap": {
    "Python Basics": {"low": 5, "medium": 3, "high": 0},
    "Web Development": {"low": 2, "medium": 4, "high": 2}
  },
  "total_tasks": 50,
  "completed_tasks": 15,
  "in_progress_tasks": 5,
  "not_started_tasks": 30
}
```

---

## Milestones

### Get Milestones
**GET** `/roadmaps/{roadmap_id}/milestones`

**Response**: Array of milestone objects with progress

### Create Milestones
**POST** `/roadmaps/{roadmap_id}/milestones`

Auto-generates milestones based on roadmap phases

---

## Quizzes

### Generate Quiz
**POST** `/roadmaps/{roadmap_id}/quiz/generate?section_id=topic-1&section_name=Python%20Basics`

**Response**: Quiz object with questions

### Submit Quiz
**POST** `/roadmaps/quiz/{quiz_id}/submit`

**Request Body**:
```json
{
  "answers": ["Option A", "Option B", "Option C"]
}
```

**Response**:
```json
{
  "score": 66.67,
  "total_questions": 3,
  "correct_answers": 2,
  "feedback": [
    {
      "question": "What is Python?",
      "your_answer": "Option A",
      "correct_answer": "Option A",
      "correct": true,
      "explanation": "Python is a high-level programming language."
    }
  ]
}
```

---

## Time Forecasting

### Get Completion Forecast
**GET** `/roadmaps/{roadmap_id}/forecast?weekly_hours=10`

**Response**:
```json
{
  "projected_completion_date": "2026-03-15T00:00:00Z",
  "weekly_goal_minutes": 600,
  "pace_multiplier": 1.2,
  "estimated_weeks_remaining": 15.5,
  "confidence_level": "medium"
}
```

---

## Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Testing with cURL

### Generate Roadmap
```bash
curl -X POST "http://localhost:8000/api/v1/roadmaps/generate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Python Developer",
    "skill_level": "beginner",
    "weekly_hours": 10
  }'
```

### Update Task Status
```bash
curl -X POST "http://localhost:8000/api/v1/roadmaps/tasks/123/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Get Analytics
```bash
curl -X GET "http://localhost:8000/api/v1/roadmaps/1/analytics?weekly_hours=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
