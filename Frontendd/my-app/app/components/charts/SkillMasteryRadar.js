/**
 * Skill Mastery Radar Chart
 * Shows proficiency across different skill categories using Recharts
 */
'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SkillMasteryRadar = ({ data }) => {
    if (!data || !data.category_proficiency) {
        return <div className="text-gray-500 text-center py-8">No skill data available</div>;
    }

    const { category_proficiency, overall_proficiency, mastery_level } = data;
    
    const chartData = Object.entries(category_proficiency).map(([name, cat]) => ({
        subject: name,
        A: cat.proficiency,
        fullMark: 100,
    }));

    if (chartData.length === 0) {
        return <div className="text-gray-500 text-center py-8">No categories to display</div>;
    }

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Skill Mastery</h3>
                <div className="mt-1">
                    <span className="text-3xl font-bold text-blue-600">{overall_proficiency}%</span>
                    <span className="ml-2 text-sm text-gray-600">• {mastery_level}</span>
                </div>
            </div>

            {/* Radar Chart */}
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a5568', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a0aec0', fontSize: 10 }} />
                        <Radar name="Proficiency" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                color: '#2d3748'
                            }}
                        />
                         <Legend wrapperStyle={{ fontSize: '14px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(category_proficiency).map(([name, cat]) => (
                    <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-700 font-medium truncate">{name}</span>
                        <span className="text-blue-600 font-bold ml-2">{cat.proficiency}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillMasteryRadar;
