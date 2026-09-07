'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, BookOpen, Target, Clock, Zap } from 'lucide-react';
import SkillLevelPicker from './SkillLevelPicker';
import { generateRoadmap } from '../../lib/roadmapApi';

const RoadmapGenerator = ({ onRoadmapGenerated }) => {
    const [goal, setGoal] = useState('');
    const [skillLevel, setSkillLevel] = useState('intermediate');
    const [weeklyHours, setWeeklyHours] = useState(10);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setError('Please enter a career goal or skills you want to learn');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const roadmapData = await generateRoadmap(goal, skillLevel, weeklyHours);
            onRoadmapGenerated(roadmapData);
        } catch (err) {
            console.error('Error generating roadmap:', err);
            setError(err.response?.data?.detail || 'Failed to generate roadmap. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-xl mb-6">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    What do you want to learn?
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Enter a career goal or specific skills, and our AI will build a personalized learning roadmap just for you.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Goal Input */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                            Learning Goal or Skills
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g. Become a React Native Developer, Learn Python for Data Science"
                                className="w-full px-6 py-4 text-lg text-black placeholder:text-black border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                                disabled={generating}
                            />
                            <Target className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                        </div>
                    </div>

                    {/* Skill Level Picker */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <SkillLevelPicker
                            selectedLevel={skillLevel}
                            onLevelChange={setSkillLevel}
                            weeklyHours={weeklyHours}
                            onWeeklyHoursChange={setWeeklyHours}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                            <span className="mr-2">⚠️</span>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !goal.trim()}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                                Generating Your Personalized Path...
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6 mr-3" />
                                Generate My Roadmap
                            </>
                        )}
                    </button>
                </div>

                {/* Features Grid */}
                <div className="bg-gray-50 p-8 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Personalized</h4>
                                <p className="text-sm text-gray-600">Tailored to your current skill level</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Time-Optimized</h4>
                                <p className="text-sm text-gray-600">Smart scheduling based on your pace</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <BookOpen className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Resource Rich</h4>
                                <p className="text-sm text-gray-600">Curated tutorials and guides</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoadmapGenerator;
