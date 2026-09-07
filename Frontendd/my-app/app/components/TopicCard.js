"use client";
import React from 'react';
import { GraduationCap, Code, CheckCircle } from 'lucide-react';
import AssessmentProgress from './AssessmentProgress';

/**
 * Topic Card Component
 * 
 * Displays a topic with quiz and project action buttons
 */
const TopicCard = ({ topic, roadmapId, completion, onQuizClick, onProjectClick }) => {
    const hasQuiz = true; // All topics have quizzes
    const hasProject = true; // All topics can have project submissions

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
            {/* Topic Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{topic.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{topic.description}</p>
                </div>
                {completion?.completed && (
                    <div className="ml-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                )}
            </div>

            {/* Completion Hint */}
            {!completion && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-xs text-blue-800">
                        Complete the quiz and project to unlock this topic (70%+ required)
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => onQuizClick(topic)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                >
                    <GraduationCap className="w-4 h-4" />
                    Take Quiz
                </button>
                <button
                    onClick={() => onProjectClick(topic)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-semibold"
                >
                    <Code className="w-4 h-4" />
                    Project
                </button>
            </div>
        </div>
    );
};

export default TopicCard;
