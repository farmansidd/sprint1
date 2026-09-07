"use client";
import React from 'react';
import { Award, Target, Trophy, CheckCircle } from 'lucide-react';

/**
 * Assessment Progress Component
 * 
 * Displays quiz and project assessment status for a topic
 */
const AssessmentProgress = ({ topicId, quizScore, projectScore, combinedScore, completed }) => {
    const quizPercentage = quizScore ? (quizScore / 5) * 100 : 0;
    const projectPercentage = projectScore ? projectScore * 100 : 0;
    const overallPercentage = combinedScore ? combinedScore * 100 : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Target className="w-4 h-4 mr-1 text-blue-600" />
                    Assessment Progress
                </h4>
                {completed && (
                    <span className="flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {/* Quiz Score */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Quiz
                        </span>
                        <span className="font-semibold text-gray-900">
                            {quizScore ? `${quizScore}/5` : 'Not attempted'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${quizPercentage >= 80 ? 'bg-green-500' : quizPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${quizPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Project Score */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            Project
                        </span>
                        <span className="font-semibold text-gray-900">
                            {projectScore ? `${Math.round(projectScore * 100)}%` : 'Not submitted'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${projectPercentage >= 80 ? 'bg-green-500' : projectPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${projectPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Overall Progress */}
                {(quizScore || projectScore) && (
                    <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 font-semibold">Overall</span>
                            <span className="font-bold text-gray-900">
                                {Math.round(overallPercentage)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className={`h-2.5 rounded-full transition-all ${overallPercentage >= 70 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`}
                                style={{ width: `${overallPercentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {overallPercentage >= 70 && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-xs text-green-800 font-medium">
                        ✨ You've achieved 70%+ and can proceed to the next topic!
                    </p>
                </div>
            )}
        </div>
    );
};

export default AssessmentProgress;
