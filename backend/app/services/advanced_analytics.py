"""
Advanced Analytics Service
Provides behavioral analysis, predictive modeling, skill mastery scoring, and personalized recommendations
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_, case, extract
from collections import defaultdict
import app.models as models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def get_behavioral_patterns(
    db: AsyncSession,
    user_id: int,
    days_back: int = 30
) -> Dict:
    """
    Analyze user behavioral patterns including activity heatmap and productivity insights.
    
    Returns activity by hour and day, best performing times, and engagement metrics.
    """
    cutoff_date = datetime.now() - timedelta(days=days_back)
    
    # 1. Get Task Completions
    result_tasks = await db.execute(
        select(models.TaskCompletion)
        .filter(
            models.TaskCompletion.user_id == user_id,
            models.TaskCompletion.completed_at >= cutoff_date
        )
    )
    tasks = result_tasks.scalars().all()
    
    # 2. Get Quiz Attempts
    result_quizzes = await db.execute(
        select(models.QuizAttempt)
        .filter(
            models.QuizAttempt.user_id == user_id,
            models.QuizAttempt.attempted_at >= cutoff_date
        )
    )
    quizzes = result_quizzes.scalars().all()
    
    # 3. Get Project Submissions (passed ones)
    result_projects = await db.execute(
        select(models.ProjectSubmission)
        .filter(
            models.ProjectSubmission.user_id == user_id,
            models.ProjectSubmission.submitted_at >= cutoff_date,
            models.ProjectSubmission.status == 'completed' # or passed? status=completed usually
        )
    )
    projects = result_projects.scalars().all()
    
    # Consolidate all timestamps
    timestamps = []
    for t in tasks:
        if t.completed_at: timestamps.append(t.completed_at)
    for q in quizzes:
        if q.attempted_at: timestamps.append(q.attempted_at)
    for p in projects:
        if p.submitted_at: timestamps.append(p.submitted_at)
        
    
    # Initialize heatmap data structures
    hourly_activity = defaultdict(int)  # hour -> count
    daily_activity = defaultdict(int)   # day_of_week -> count
    hourly_daily_matrix = defaultdict(lambda: defaultdict(int))  # day -> hour -> count
    
    for ts in timestamps:
        hour = ts.hour
        day = ts.weekday()  # 0=Monday, 6=Sunday
        
        hourly_activity[hour] += 1
        daily_activity[day] += 1
        hourly_daily_matrix[day][hour] += 1
    
    # Find peak productivity times
    peak_hour = max(hourly_activity.items(), key=lambda x: x[1])[0] if hourly_activity else 12
    peak_day = max(daily_activity.items(), key=lambda x: x[1])[0] if daily_activity else 0
    
    # Calculate activity score (items per day)
    total_items = len(timestamps)
    activity_score = total_items / days_back if days_back > 0 else 0
    
    # Build heatmap matrix (7 days x 24 hours)
    heatmap_matrix = []
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for day in range(7):
        day_data = {
            'day': day_names[day],
            'hours': [hourly_daily_matrix[day].get(hour, 0) for hour in range(24)]
        }
        heatmap_matrix.append(day_data)
    
    return {
        'heatmap_matrix': heatmap_matrix,
        'hourly_activity': dict(hourly_activity),
        'daily_activity': dict(daily_activity),
        'peak_hour': peak_hour,
        'peak_day': day_names[peak_day],
        'activity_score': round(activity_score, 2),
        'total_completions': total_items,
        'best_time_recommendation': f"{day_names[peak_day]} at {peak_hour}:00"
    }


async def calculate_skill_mastery(
    db: AsyncSession,
    roadmap_id: int,
    user_id: int
) -> Dict:
    """
    Calculate skill mastery scores based on Topic and Level completions (Quiz + Project scores).
    
    Returns proficiency scores by Level and overall mastery level.
    """
    # 1. Fetch Topic Completions (Granular Mastery)
    topic_results = await db.execute(
        select(models.TopicCompletion)
        .filter(
            models.TopicCompletion.roadmap_id == roadmap_id,
            models.TopicCompletion.user_id == user_id
        )
    )
    topic_completions = topic_results.scalars().all()
    
    # 2. Fetch Level Completions (High-Level Mastery)
    level_results = await db.execute(
        select(models.LevelCompletion)
        .join(models.Level)
        .filter(
            models.LevelCompletion.roadmap_id == roadmap_id,
            models.LevelCompletion.user_id == user_id
        )
    )
    level_completions = level_results.scalars().all()
    
    # 3. Calculate Proficiency per Level (using Topic Completions grouped by Level if possible, or usually just LevelCompletion is enough if available)
    # But TopicCompletion has detailed scores.
    
    # Let's aggregate by Level Name/ID
    level_stats = defaultdict(lambda: {'total_score': 0, 'count': 0, 'completed_count': 0})
    
    # If we have level completions, use them as primary source
    for lc in level_completions:
        # We need level name, fetch separate or join? Join was added above.
        # But wait, scalar only returns LevelCompletion. We need to access .level property.
        # Assuming eager load or lazy load works.
        level_name = f"Level {lc.level_id}" # Fallback
        
        # We need to fetch level name if not eager loaded.
        # Models say lazy="selectin", so it should work.
        if lc.level:
            level_name = lc.level.name
            
        score = lc.combined_score * 100 # Convert 0-1 to 0-100
        level_stats[level_name]['total_score'] += score
        level_stats[level_name]['count'] += 1
        if lc.completed:
            level_stats[level_name]['completed_count'] += 1

    # Also include Topic Completions for granularity?
    # Maybe group topics by level?
    # For simplicity, if LevelCompletion exists, it's the source of truth for "Levels".
    
    category_proficiency = {}
    total_mastery_sum = 0
    total_items = 0
    
    for level_name, stats in level_stats.items():
        avg_mastery = stats['total_score'] / stats['count'] if stats['count'] > 0 else 0
        completion_rate = (stats['completed_count'] / stats['count']) * 100 # Logic might be flawed if count is 1 per level
        
        # Actually LevelCompletion is one per level. So count is 1.
        # So avg_mastery IS the score.
        
        category_proficiency[level_name] = {
            'proficiency': round(avg_mastery, 1),
            'completed': stats['completed_count'],
            'total': stats['count'],
            'mastery_score': round(avg_mastery, 1)
        }
        total_mastery_sum += avg_mastery
        total_items += 1
        
    # Overall mastery
    if total_items > 0:
        overall_proficiency = total_mastery_sum / total_items
    else:
        overall_proficiency = 0
        
    # Determine mastery level
    if overall_proficiency >= 85:
        mastery_level_label = 'Expert'
    elif overall_proficiency >= 70:
        mastery_level_label = 'Advanced'
    elif overall_proficiency >= 50:
        mastery_level_label = 'Intermediate'
    elif overall_proficiency >= 25:
        mastery_level_label = 'Beginner'
    else:
        mastery_level_label = 'Novice'
    
    return {
        'category_proficiency': category_proficiency,
        'overall_proficiency': round(overall_proficiency, 1),
        'mastery_level': mastery_level_label,
        'total_skills': len(topic_completions), # Proxy for total items done or to do? 
        'completed_skills': sum(1 for tc in topic_completions if tc.completed)
    }


async def get_performance_insights(
    db: AsyncSession,
    user_id: int,
    weeks: int = 8
) -> Dict:
    """
    Analyze performance trends over time including velocity, efficiency, and consistency.
    """
    cutoff_date = datetime.now() - timedelta(weeks=weeks)
    
    # Get weekly completion data
    result = await db.execute(
        select(
            func.date_trunc('week', models.TaskCompletion.completed_at).label('week'),
            func.count(models.TaskCompletion.id).label('count'),
            func.avg(models.TaskCompletion.time_spent_minutes).label('avg_time')
        )
        .filter(
            models.TaskCompletion.user_id == user_id,
            models.TaskCompletion.completed_at >= cutoff_date
        )
        .group_by('week')
        .order_by('week')
    )
    
    weekly_data = result.all()
    
    # Build time series
    timeline = []
    for week, count, avg_time in weekly_data:
        timeline.append({
            'week': week.isoformat() if week else None,
            'tasks_completed': count,
            'avg_time_minutes': round(avg_time, 1) if avg_time else 0
        })
    
    # Calculate trends
    if len(timeline) >= 2:
        recent_avg = sum(w['tasks_completed'] for w in timeline[-4:]) / min(4, len(timeline[-4:]))
        older_avg = sum(w['tasks_completed'] for w in timeline[:-4]) / max(1, len(timeline[:-4]))
        
        velocity_trend = 'increasing' if recent_avg > older_avg else 'decreasing' if recent_avg < older_avg else 'stable'
        velocity_change = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
    else:
        velocity_trend = 'insufficient_data'
        velocity_change = 0
    
    # Consistency score (based on standard deviation)
    if len(timeline) > 1:
        task_counts = [w['tasks_completed'] for w in timeline]
        mean = sum(task_counts) / len(task_counts)
        variance = sum((x - mean) ** 2 for x in task_counts) / len(task_counts)
        std_dev = variance ** 0.5
        
        # Lower std_dev = higher consistency
        consistency_score = max(0, 100 - (std_dev * 10))
    else:
        consistency_score = 50
    
    return {
        'timeline': timeline,
        'velocity_trend': velocity_trend,
        'velocity_change_percent': round(velocity_change, 1),
        'consistency_score': round(consistency_score, 1),
        'weeks_analyzed': weeks
    }


async def get_comparative_analytics(
    db: AsyncSession,
    user_id: int
) -> Dict:
    """
    Compare user performance against platform averages.
    """
    # Get user stats
    user_result = await db.execute(
        select(
            func.count(models.TaskCompletion.id).label('completions'),
            func.avg(models.TaskCompletion.time_spent_minutes).label('avg_time')
        )
        .filter(models.TaskCompletion.user_id == user_id)
    )
    
    user_stats = user_result.one()
    
    # Get platform averages
    platform_result = await db.execute(
        select(
            func.avg(func.count(models.TaskCompletion.id)).over().label('avg_completions'),
            func.avg(models.TaskCompletion.time_spent_minutes).label('avg_time')
        )
        .group_by(models.TaskCompletion.user_id)
    )
    
    platform_stats = platform_result.first()
    
    if platform_stats:
        platform_avg_completions = platform_stats[0] or 0
        platform_avg_time = platform_stats[1] or 0
    else:
        platform_avg_completions = 0
        platform_avg_time = 0
    
    # Calculate percentiles
    user_completions = user_stats[0] or 0
    user_avg_time = user_stats[1] or 0
    
    # Simple percentile calculation
    if platform_avg_completions > 0:
        completion_percentile = min(99, (user_completions / platform_avg_completions) * 50)
    else:
        completion_percentile = 50
    
    return {
        'user_total_completions': user_completions,
        'platform_avg_completions': round(platform_avg_completions, 1),
        'user_avg_time': round(user_avg_time, 1),
        'platform_avg_time': round(platform_avg_time, 1),
        'completion_percentile': round(completion_percentile, 1),
        'performance_rating': 'above_average' if user_completions > platform_avg_completions else 'average'
    }


async def generate_smart_recommendations(
    db: AsyncSession,
    user_id: int,
    roadmap_id: int
) -> List[Dict]:
    """
    Generate personalized learning recommendations based on user behavior and performance.
    """
    recommendations = []
    
    # Get behavioral patterns
    patterns = await get_behavioral_patterns(db, user_id)
    
    # Get skill mastery
    mastery = await calculate_skill_mastery(db, roadmap_id, user_id)
    
    # Get performance insights
    insights = await get_performance_insights(db, user_id)
    
    # Recommendation 1: Optimal study time
    if patterns['peak_hour']:
        recommendations.append({
            'type': 'schedule',
            'priority': 'high',
            'title': 'Optimize Your Study Schedule',
            'description': f"Your most productive time is {patterns['best_time_recommendation']}. Try to schedule your most challenging tasks during this window.",
            'icon': 'clock',
            'actionable': True
        })
    
    # Recommendation 2: Consistency improvement
    if insights['consistency_score'] < 60:
        recommendations.append({
            'type': 'consistency',
            'priority': 'medium',
            'title': 'Build a Consistent Routine',
            'description': f"Your consistency score is {insights['consistency_score']:.0f}/100. Try to study at regular intervals to improve retention and build momentum.",
            'icon': 'target',
            'actionable': True
        })
    
    # Recommendation 3: Focus on weak categories
    if mastery['category_proficiency']:
        weakest_category = min(
            mastery['category_proficiency'].items(),
            key=lambda x: x[1]['proficiency']
        )
        
        if weakest_category[1]['proficiency'] < 50:
            recommendations.append({
                'type': 'skill_focus',
                'priority': 'high',
                'title': f'Strengthen {weakest_category[0]} Skills',
                'description': f"Your proficiency in {weakest_category[0]} is {weakest_category[1]['proficiency']:.0f}%. Allocate more time to this area for balanced growth.",
                'icon': 'book',
                'actionable': True,
                'category': weakest_category[0]
            })
    
    # Recommendation 4: Velocity boost
    if insights['velocity_trend'] == 'decreasing':
        recommendations.append({
            'type': 'motivation',
            'priority': 'medium',
            'title': 'Boost Your Learning Velocity',
            'description': f"Your completion rate has decreased by {abs(insights['velocity_change_percent']):.0f}%. Set smaller daily goals to rebuild momentum.",
            'icon': 'trending-up',
            'actionable': True
        })
    
    # Recommendation 5: Break patterns
    if patterns['activity_score'] > 3:  # More than 3 tasks per day
        recommendations.append({
            'type': 'wellness',
            'priority': 'low',
            'title': 'Remember to Take Breaks',
            'description': "You're maintaining a high activity level. Don't forget to take regular breaks to prevent burnout and improve retention.",
            'icon': 'coffee',
            'actionable': False
        })
    
    return recommendations


async def get_focus_insights(
    db: AsyncSession,
    user_id: int,
    days_back: int = 14
) -> Dict:
    """
    Analyze focus patterns including session duration, break frequency, and productivity cycles.
    """
    cutoff_date = datetime.now() - timedelta(days=days_back)
    
    # Get task completions with time spent
    result = await db.execute(
        select(models.TaskCompletion)
        .filter(
            models.TaskCompletion.user_id == user_id,
            models.TaskCompletion.completed_at >= cutoff_date,
            models.TaskCompletion.time_spent_minutes.isnot(None)
        )
        .order_by(models.TaskCompletion.started_at)
    )
    
    completions = result.scalars().all()
    
    if not completions:
        return {
            'average_session_duration': 0,
            'optimal_session_duration': 45,
            'focus_score': 0,
            'recommendation': 'Complete more tasks to generate insights'
        }
    
    # Calculate session metrics
    session_durations = [c.time_spent_minutes for c in completions if c.time_spent_minutes]
    avg_session = sum(session_durations) / len(session_durations) if session_durations else 0
    
    # Optimal session is between 25-50 minutes (Pomodoro-inspired)
    optimal_duration = 45
    focus_score = max(0, 100 - abs(avg_session - optimal_duration) * 2)
    
    # Generate recommendation
    if avg_session < 20:
        recommendation = "Try longer focus sessions (25-45 min) for deeper learning"
    elif avg_session > 60:
        recommendation = "Consider shorter sessions with breaks to maintain concentration"
    else:
        recommendation = "Your session duration is optimal for focused learning"
    
    return {
        'average_session_duration': round(avg_session, 1),
        'optimal_session_duration': optimal_duration,
        'focus_score': round(focus_score, 1),
        'total_sessions': len(completions),
        'recommendation': recommendation
    }
