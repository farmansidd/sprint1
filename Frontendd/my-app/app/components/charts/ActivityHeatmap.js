/**
 * Activity Heatmap Component
 * GitHub-style contribution heatmap showing user activity patterns
 */
'use client';

import React from 'react';

const ActivityHeatmap = ({ data }) => {
    if (!data || !data.heatmap_matrix) {
        return <div className="text-gray-500 text-center py-8">No activity data available</div>;
    }

    const { heatmap_matrix, peak_day, peak_hour, best_time_recommendation } = data;

    // Calculate max value for color scaling
    const maxValue = Math.max(
        ...heatmap_matrix.flatMap(day => day.hours),
        1
    );

    // Color intensity function
    const getColor = (value) => {
        if (value === 0) return 'bg-gray-100';
        const intensity = Math.ceil((value / maxValue) * 4);
        const colors = [
            'bg-blue-200',
            'bg-blue-300',
            'bg-blue-500',
            'bg-blue-600',
            'bg-blue-700'
        ];
        return colors[intensity] || colors[colors.length - 1];
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Activity Heatmap</h3>
                    <p className="text-sm text-gray-600">Weekly activity by hour</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">{best_time_recommendation}</div>
                    <div className="text-xs text-gray-500">Your peak time</div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Hour labels */}
                    <div className="flex mb-2">
                        <div className="w-24 flex-shrink-0"></div>
                        <div className="flex-1 flex justify-between px-1">
                            {[0, 6, 12, 18, 23].map(hour => (
                                <div key={hour} className="text-xs text-gray-500 w-10 text-center">
                                    {hour}:00
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap rows */}
                    {heatmap_matrix.map((dayData, dayIdx) => (
                        <div key={dayIdx} className="flex items-center mb-1">
                            {/* Day label */}
                            <div className="w-24 text-sm text-gray-700 font-medium flex-shrink-0">
                                {dayData.day.substring(0, 3)}
                            </div>

                            {/* Hour cells */}
                            <div className="flex-1 flex gap-1">
                                {dayData.hours.map((value, hourIdx) => (
                                    <div
                                        key={hourIdx}
                                        className={`h-6 flex-1 rounded ${getColor(value)} transition-all hover:ring-2 hover:ring-blue-400 cursor-pointer group relative`}
                                        title={`${dayData.day} ${hourIdx}:00 - ${value} tasks`}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                                {value} task{value !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
                <span>Less active</span>
                <div className="flex gap-1">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <div className="w-4 h-4 bg-blue-200 rounded"></div>
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <div className="w-4 h-4 bg-blue-700 rounded"></div>
                </div>
                <span>More active</span>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
