/**
 * Enhanced Analytics Dashboard Component
 * Comprehensive analytics with tabs, charts, and insights
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Clock, AlertTriangle, Target, Calendar, BarChart3,
    Activity, Brain, Lightbulb, Award, Download, RefreshCw
} from 'lucide-react';
import { getRoadmapAnalytics, getTimeForecasting } from '../../lib/roadmapApi';
import * as advancedAnalytics from '../../lib/analyticsApi';

// Chart components
import ActivityHeatmap from './charts/ActivityHeatmap';
import SkillMasteryRadar from './charts/SkillMasteryRadar';
import ProgressTimelineChart from './charts/ProgressTimelineChart';

// Insight components
import SmartRecommendations from './insights/SmartRecommendations';
import FocusInsights from './insights/FocusInsights';

const EnhancedAnalyticsDashboard = ({ roadmapId, weeklyHours = 10 }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [analytics, setAnalytics] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [behavioralData, setBehavioralData] = useState(null);
    const [skillMastery, setSkillMastery] = useState(null);
    const [performanceInsights, setPerformanceInsights] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [focusInsights, setFocusInsights] = useState(null);
    const [comparative, setComparative] = useState(null);
    const [performanceScore, setPerformanceScore] = useState(0);

    useEffect(() => {
        const calculatePerformanceScore = () => {
            if (!analytics || !forecast || !skillMastery) return 0;

            const { weekly_completion_rate } = analytics;
            const { pace_multiplier } = forecast;
            const { overall_proficiency } = skillMastery;

            // Weighted scores (customize weights as needed)
            const completionScore = Math.min(weekly_completion_rate / 10, 1) * 40; // Assume 10 tasks/week is a good goal
            const paceScore = Math.min(pace_multiplier / 1.5, 1) * 30; // Assume 1.5x is a good pace
            const masteryScore = (overall_proficiency / 100) * 30;

            const totalScore = Math.round(completionScore + paceScore + masteryScore);
            return Math.min(totalScore, 100); // Cap at 100
        };

        setPerformanceScore(calculatePerformanceScore());
    }, [analytics, forecast, skillMastery]);

    const fetchAllAnalytics = async () => {
        try {
            setRefreshing(true);

            // Fetch all analytics data in parallel
            const [
                analyticsData,
                forecastData,
                behavioralPatternsData,
                skillMasteryData,
                performanceData,
                recommendationsData,
                focusData,
                comparativeData,
                learningStateData
            ] = await Promise.all([
                getRoadmapAnalytics(roadmapId, weeklyHours),
                getTimeForecasting(roadmapId, weeklyHours),
                advancedAnalytics.getBehavioralPatterns(30),
                advancedAnalytics.getSkillMastery(roadmapId),
                advancedAnalytics.getPerformanceInsights(8),
                advancedAnalytics.getRecommendations(roadmapId),
                advancedAnalytics.getFocusInsights(14),
                advancedAnalytics.getComparativeAnalytics(),
                // Fetch Learning State
                fetch('/api/v1/learning/state', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }).then(res => res.ok ? res.json() : null).catch(err => null)
            ]);

            setAnalytics({ ...analyticsData, learning_state: learningStateData });
            setForecast(forecastData);
            setBehavioralData(behavioralPatternsData);
            setSkillMastery(skillMasteryData);
            setPerformanceInsights(performanceData);
            setRecommendations(recommendationsData.recommendations || []);
            setFocusInsights(focusData);
            setComparative(comparativeData);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (roadmapId) {
            fetchAllAnalytics();
        }
    }, [roadmapId, weeklyHours]);

    if (loading && !analytics) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading advanced analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics || !forecast) {
        return (
            <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Analytics data unavailable</p>
            </div>
        );
    }

    const progressPercent = analytics.total_tasks > 0
        ? (analytics.completed_tasks / analytics.total_tasks * 100).toFixed(1)
        : 0;

    const tabs = [
        { id: 'overview', name: 'Overview', icon: Target },
        { id: 'performance', name: 'Performance', icon: TrendingUp },
        { id: 'insights', name: 'Insights', icon: Brain },
        { id: 'recommendations', name: 'Recommendations', icon: Lightbulb }
    ];

    return (
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Top bar with actions */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-blue-600" />
                        Advanced Analytics
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchAllAnalytics}
                            disabled={refreshing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4 mr-2" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Progress Overview */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Overall Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Performance Score</span>
                                        <Activity className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">{performanceScore}</div>
                                    <div className="text-sm text-indigo-700 mt-1 font-medium">Top 15%</div>
                                </div>

                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Mastery</span>
                                        <Award className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {analytics.learning_state ? analytics.learning_state.mastery_level : "N/A"}
                                    </div>
                                    <div className="text-xs text-purple-700 mt-1 font-medium">
                                        Level: {(analytics.learning_state?.mastery_score * 100).toFixed(0)}/100
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Project Avg</span>
                                        <Target className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {analytics.learning_state ? Math.round(analytics.learning_state.project_average) : 0}%
                                    </div>
                                    <div className="text-xs text-green-700 mt-1 font-medium">Based on submission pass rate</div>
                                </div>

                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Quiz Avg</span>
                                        <Lightbulb className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {analytics.learning_state ? Math.round(analytics.learning_state.quiz_average) : 0}%
                                    </div>
                                    <div className="text-xs text-orange-700 mt-1 font-medium">Based on topic quizzes</div>
                                </div>
                            </div>
                        </div>

                        {/* Completion Forecast */}
                        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2" />
                                Completion Forecast
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm opacity-90 mb-1">Projected Date</div>
                                    <div className="text-3xl font-bold">
                                        {forecast.projected_completion_date
                                            ? new Date(forecast.projected_completion_date).toLocaleDateString()
                                            : 'N/A'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm opacity-90">Weeks Left</div>
                                        <div className="text-2xl font-bold">{forecast.estimated_weeks_remaining}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm opacity-90">Your Pace</div>
                                        <div className="text-2xl font-bold">{forecast.pace_multiplier}x</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/10 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Confidence</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${forecast.confidence_level === 'high' ? 'bg-green-500' :
                                            forecast.confidence_level === 'medium' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}>
                                            {forecast.confidence_level?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Heatmap */}
                        {behavioralData && (
                            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <ActivityHeatmap data={behavioralData} />
                            </div>
                        )}

                        {/* Comparative Analytics */}
                        {comparative && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                                    vs Platform Average
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Total Completions</span>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-blue-600">{comparative.user_total_completions}</div>
                                            <div className="text-xs text-gray-500">vs {comparative.platform_avg_completions.toFixed(0)} avg</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Percentile Rank</span>
                                        <div className="text-2xl font-bold text-purple-600">{comparative.completion_percentile.toFixed(0)}th</div>
                                    </div>
                                    <div className={`p-4 rounded-lg text-center font-semibold ${comparative.performance_rating === 'above_average'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {comparative.performance_rating === 'above_average' ? '🎉 Above Average!' : '👍 On Track'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Velocity */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                                Learning Velocity
                            </h3>
                            <div className="text-center">
                                {analytics.learning_state ? (
                                    <>
                                        <div className="text-4xl font-bold text-gray-900 mb-2">
                                            {analytics.learning_state.current_velocity_band}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">Velocity Band</div>

                                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
                                            <span>Mastery: <span className="font-bold text-gray-800">{analytics.learning_state.mastery_level}</span></span>
                                            <span>Score: {analytics.learning_state.mastery_score.toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-5xl font-bold text-green-600 mb-2">
                                            {analytics.weekly_completion_rate.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-gray-600 mb-4">Tasks per week</div>
                                        <div className="text-sm text-gray-700">
                                            Weekly Goal: <span className="font-semibold">{Math.ceil(forecast.weekly_goal_minutes / 60)} hours</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Performance Score */}
                        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-center items-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Score</h3>
                            <p className="text-sm text-gray-600 text-center mb-4">An overall measure of your learning effectiveness.</p>
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e6e6e6"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={performanceScore > 75 ? '#10B981' : performanceScore > 50 ? '#F59E0B' : '#EF4444'}
                                        strokeWidth="3"
                                        strokeDasharray={`${performanceScore}, 100`}
                                    />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                    <span className="text-4xl font-bold text-gray-900">{performanceScore}</span>
                                    <span className="text-sm text-gray-600 block">/ 100</span>
                                </div>
                            </div>
                            <div className={`mt-4 text-center px-4 py-2 rounded-lg ${performanceScore > 75 ? 'bg-green-100 text-green-800' : performanceScore > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {performanceScore > 75 ? 'Excellent!' : performanceScore > 50 ? 'Good Progress' : 'Needs Improvement'}
                            </div>
                        </div>

                        {/* Performance Timeline */}
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Learning Velocity</h3>
                            <p className="text-sm text-gray-600 mb-4">Tracks the number of tasks completed over time, showing your learning momentum.</p>
                            {performanceInsights ? (
                                <ProgressTimelineChart data={performanceInsights} />
                            ) : (
                                <div className="text-center py-8 text-gray-500">No performance data available.</div>
                            )}
                        </div>

                        {/* Skill Mastery Radar */}
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Skill Mastery</h3>
                            <p className="text-sm text-gray-600 mb-4">Visualizes your proficiency in different skill categories against the ideal mastery level.</p>
                            {skillMastery ? (
                                <SkillMasteryRadar data={skillMastery} />
                            ) : (
                                <div className="text-center py-8 text-gray-500">No skill mastery data available.</div>
                            )}
                        </div>

                        {/* Bottlenecks */}
                        {analytics.bottleneck_topics && analytics.bottleneck_topics.length > 0 && (
                            <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                    Focus Areas
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">These are topics where your progress is slower. Focusing on these could significantly boost your overall performance.</p>
                                <div className="space-y-3">
                                    {analytics.bottleneck_topics.map((topic, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-5 h-5 text-orange-600" />
                                                <span className="text-gray-900 font-medium">{topic}</span>
                                            </div>
                                            <span className="text-xs text-orange-700 font-semibold">Review</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Focus Insights */}
                        {focusInsights && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <FocusInsights data={focusInsights} />
                            </div>
                        )}

                        {/* Difficulty Heatmap */}
                        {analytics.difficulty_heatmap && Object.keys(analytics.difficulty_heatmap).length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Difficulty Distribution</h3>
                                <div className="space-y-4">
                                    {Object.entries(analytics.difficulty_heatmap).map(([topic, difficulties]) => (
                                        <div key={topic}>
                                            <div className="text-sm font-semibold text-gray-900 mb-2">{topic}</div>
                                            <div className="flex space-x-1">
                                                {difficulties.low > 0 && (
                                                    <div
                                                        className="bg-green-500 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                                                        style={{ width: `${(difficulties.low / (difficulties.low + difficulties.medium + difficulties.high)) * 100}%` }}
                                                    >
                                                        {difficulties.low}
                                                    </div>
                                                )}
                                                {difficulties.medium > 0 && (
                                                    <div
                                                        className="bg-yellow-500 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                                                        style={{ width: `${(difficulties.medium / (difficulties.low + difficulties.medium + difficulties.high)) * 100}%` }}
                                                    >
                                                        {difficulties.medium}
                                                    </div>
                                                )}
                                                {difficulties.high > 0 && (
                                                    <div
                                                        className="bg-red-500 h-8 rounded flex items-center justify-center text-white text-xs font-semibold"
                                                        style={{ width: `${(difficulties.high / (difficulties.low + difficulties.medium + difficulties.high)) * 100}%` }}
                                                    >
                                                        {difficulties.high}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>Easy: {difficulties.low}</span>
                                                <span>Medium: {difficulties.medium}</span>
                                                <span>Hard: {difficulties.high}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center space-x-2 mb-2 text-blue-100">
                                    <Lightbulb className="w-5 h-5" />
                                    <span className="font-semibold tracking-wide uppercase text-xs">AI Strategic Advisor</span>
                                </div>

                                <h3 className="text-3xl font-bold mb-4">
                                    {analytics.learning_state?.next_recommended_task_id
                                        ? "Your Next Best Action"
                                        : "Start Your Learning Journey"}
                                </h3>

                                <p className="text-blue-100 text-lg mb-8 max-w-2xl leading-relaxed">
                                    {analytics.learning_state?.next_recommended_task_id
                                        ? `Based on your ${analytics.learning_state.current_velocity_band} velocity and ${analytics.learning_state.mastery_level} mastery, we've selected this task to optimize your growth.`
                                        : "Complete your first task to unlock personalized AI recommendations tailored to your learning pace."}
                                </p>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 inline-block min-w-[300px]">
                                    <div className="text-sm text-blue-200 mb-1">Recommended Task</div>
                                    <div className="text-xl font-bold flex items-center">
                                        {analytics.learning_state?.next_recommended_task_id || "Begin First Module"}
                                        <TrendingUp className="w-5 h-5 ml-3 text-green-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Context Cards */}
                        {analytics.learning_state && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                                        Current Velocity Context
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Velocity Band</span>
                                            <span className="font-bold text-indigo-600">{analytics.learning_state.current_velocity_band}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Your current pace determines whether we suggest review tasks (Stalled) or challenges (Fast).
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                        <Award className="w-5 h-5 mr-2 text-purple-600" />
                                        Mastery Context
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600">Mastery Level</span>
                                            <span className="font-bold text-purple-600">{analytics.learning_state.mastery_level}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            Your mastery score ({analytics.learning_state.mastery_score.toFixed(2)}) influences the complexity of recommended tasks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedAnalyticsDashboard;
