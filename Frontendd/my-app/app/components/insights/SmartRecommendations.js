/**
 * Smart Recommendations Component
 * AI-powered personalized learning suggestions
 */
'use client';

import React from 'react';
import { Clock, Target, Book, TrendingUp, Coffee, Lightbulb, AlertCircle } from 'lucide-react';

const SmartRecommendations = ({ recommendations }) => {
    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No recommendations available yet</p>
                <p className="text-sm mt-1">Complete more tasks to get personalized insights</p>
            </div>
        );
    }

    const iconMap = {
        'clock': Clock,
        'target': Target,
        'book': Book,
        'trending-up': TrendingUp,
        'coffee': Coffee,
        'lightbulb': Lightbulb
    };

    const priorityColors = {
        'high': 'border-red-300 bg-red-50',
        'medium': 'border-yellow-300 bg-yellow-50',
        'low': 'border-blue-300 bg-blue-50'
    };

    const priorityBadges = {
        'high': 'bg-red-100 text-red-700',
        'medium': 'bg-yellow-100 text-yellow-700',
        'low': 'bg-blue-100 text-blue-700'
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Smart Recommendations
                </h3>
                <span className="text-xs text-gray-500">{recommendations.length} suggestions</span>
            </div>

            <div className="space-y-3">
                {recommendations.map((rec, index) => {
                    const Icon = iconMap[rec.icon] || AlertCircle;
                    const priorityColor = priorityColors[rec.priority] || priorityColors['low'];
                    const priorityBadge = priorityBadges[rec.priority] || priorityBadges['low'];

                    return (
                        <div
                            key={index}
                            className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${priorityColor}`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityBadge}`}>
                                            {rec.priority}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {rec.description}
                                    </p>

                                    {rec.actionable && (
                                        <div className="mt-3">
                                            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                                                Take Action
                                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SmartRecommendations;
