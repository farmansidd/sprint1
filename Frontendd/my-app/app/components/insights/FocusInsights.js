/**
 * Focus Insights Component
 * Displays focus patterns and session duration analysis
 */
'use client';

import React from 'react';
import { Brain, Clock, Zap, TrendingUp } from 'lucide-react';

const FocusInsights = ({ data }) => {
    if (!data) {
        return <div className="text-gray-500 text-center py-8">No focus data available</div>;
    }

    const {
        average_session_duration,
        optimal_session_duration,
        focus_score,
        total_sessions,
        recommendation
    } = data;

    // Calculate progress percentage for focus score
    const scorePercentage = Math.min(100, focus_score);

    // Determine score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                    Focus Insights
                </h3>
            </div>

            {/* Focus Score */}
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                <div className={`text-5xl font-bold ${getScoreColor(focus_score)} mb-2`}>
                    {focus_score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Focus Score</div>

                {/* Score visualization */}
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${focus_score >= 80 ? 'bg-green-500' : focus_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${scorePercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Session Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getScoreBg(focus_score)} ${getScoreColor(focus_score)}`}>
                            {average_session_duration < optimal_session_duration - 10 ? 'Too Short' :
                                average_session_duration > optimal_session_duration + 15 ? 'Too Long' :
                                    'Optimal'}
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {average_session_duration.toFixed(0)}m
                    </div>
                    <div className="text-xs text-gray-600">Avg Session</div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {optimal_session_duration}m
                    </div>
                    <div className="text-xs text-gray-600">Optimal Session</div>
                </div>
            </div>

            {/* Total Sessions */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-600 mb-1">Total Focus Sessions</div>
                        <div className="text-3xl font-bold text-blue-600">{total_sessions}</div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Recommendation</h4>
                        <p className="text-sm opacity-90">{recommendation}</p>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Pro Tips</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Take a 5-10 minute break every 25-45 minutes</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Eliminate distractions during focus sessions</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Stay hydrated and maintain good posture</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default FocusInsights;
