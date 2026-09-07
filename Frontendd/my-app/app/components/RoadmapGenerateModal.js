/**
 * Enhanced Roadmap Generation Modal
 * Integrates skill level picker for personalized roadmap generation
 */
'use client';

import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import SkillLevelPicker from '../components/SkillLevelPicker';
import { generateRoadmap } from '../../lib/roadmapApi';

const RoadmapGenerateModal = ({ isOpen, onClose, onRoadmapGenerated }) => {
    const [goal, setGoal] = useState('');
    const [skillLevel, setSkillLevel] = useState('intermediate');
    const [weeklyHours, setWeeklyHours] = useState(10);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setError('Please enter a career goal');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const roadmapData = await generateRoadmap(goal, skillLevel, weeklyHours);
            onRoadmapGenerated(roadmapData);
            onClose();
        } catch (err) {
            console.error('Error generating roadmap:', err);
            setError(err.response?.data?.detail || 'Failed to generate roadmap. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Generate AI Roadmap</h2>
                            <p className="text-sm text-gray-600">Personalized learning path powered by AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Goal Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            What's your career goal?
                        </label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g., Python Full-Stack Developer, Data Scientist, DevOps Engineer"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                            disabled={generating}
                        />
                    </div>

                    {/* Skill Level Picker */}
                    <SkillLevelPicker
                        selectedLevel={skillLevel}
                        onLevelChange={setSkillLevel}
                        weeklyHours={weeklyHours}
                        onWeeklyHoursChange={setWeeklyHours}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>✓ Personalized learning path based on your skill level</li>
                            <li>✓ Estimated time for each task</li>
                            <li>✓ Curated learning resources</li>
                            <li>✓ Progress tracking and analytics</li>
                            <li>✓ AI-powered recommendations</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                        disabled={generating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !goal.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Roadmap</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoadmapGenerateModal;
