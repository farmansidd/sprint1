/**
 * Skill Level Picker Component
 * Allows users to select their skill level when generating a roadmap
 */
'use client';

import React, { useState } from 'react';
import { User, Zap, Award } from 'lucide-react';

const SkillLevelPicker = ({ selectedLevel, onLevelChange, weeklyHours, onWeeklyHoursChange }) => {
    const skillLevels = [
        {
            id: 'beginner',
            name: 'Beginner',
            icon: User,
            description: 'New to this field, need fundamentals',
            color: 'bg-green-50 border-green-200 text-green-700',
            activeColor: 'bg-green-500 text-white border-green-600'
        },
        {
            id: 'intermediate',
            name: 'Intermediate',
            icon: Zap,
            description: 'Have some experience, ready to advance',
            color: 'bg-blue-50 border-blue-200 text-blue-700',
            activeColor: 'bg-blue-500 text-white border-blue-600'
        },
        {
            id: 'advanced',
            name: 'Advanced',
            icon: Award,
            description: 'Experienced, seeking mastery',
            color: 'bg-purple-50 border-purple-200 text-purple-700',
            activeColor: 'bg-purple-500 text-white border-purple-600'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Skill Level Selection */}
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                    What's your current skill level?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {skillLevels.map((level) => {
                        const Icon = level.icon;
                        const isActive = selectedLevel === level.id;
                        const colorClass = isActive ? level.activeColor : level.color;

                        return (
                            <button
                                key={level.id}
                                type="button"
                                onClick={() => onLevelChange(level.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${colorClass}`}
                            >
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <Icon className="w-8 h-8" />
                                    <h3 className="font-bold text-lg">{level.name}</h3>
                                    <p className={`text-xs ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                                        {level.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Hours Input */}
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    How many hours per week can you dedicate?
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="range"
                        min="1"
                        max="40"
                        value={weeklyHours}
                        onChange={(e) => onWeeklyHoursChange(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex items-center space-x-2 min-w-[100px]">
                        <span className="text-2xl font-bold text-blue-600">{weeklyHours}</span>
                        <span className="text-sm text-gray-600">hours/week</span>
                    </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hour</span>
                    <span>40 hours</span>
                </div>
            </div>
        </div>
    );
};

export default SkillLevelPicker;
