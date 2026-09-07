/**
 * Progress Timeline Chart
 * Line chart showing completion trends over time
 */
'use client';

import React from 'react';

const ProgressTimelineChart = ({ data }) => {
    if (!data || !data.timeline || data.timeline.length === 0) {
        return <div className="text-gray-500 text-center py-8">No timeline data available</div>;
    }

    const { timeline, velocity_trend, velocity_change_percent } = data;

    // Chart dimensions
    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value for scaling
    const maxTasks = Math.max(...timeline.map(w => w.tasks_completed), 1);

    // Calculate points
    const points = timeline.map((week, index) => {
        const x = padding + (index / (timeline.length - 1)) * chartWidth;
        const y = height - padding - (week.tasks_completed / maxTasks) * chartHeight;
        return { x, y, week };
    });

    // Generate path
    const linePath = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Generate area path
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    // Y-axis labels
    const yLabels = [0, Math.ceil(maxTasks / 2), maxTasks];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Learning Velocity</h3>
                    <p className="text-sm text-gray-600">Tasks completed per week</p>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-semibold ${velocity_trend === 'increasing' ? 'text-green-600' : velocity_trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                        {velocity_trend === 'increasing' ? '↑' : velocity_trend === 'decreasing' ? '↓' : '→'} {Math.abs(velocity_change_percent).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{velocity_trend.replace('_', ' ')}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex justify-center">
                <svg width={width} height={height} className="overflow-visible">
                    {/* Y-axis grid lines */}
                    {yLabels.map((value, i) => {
                        const y = height - padding - (value / maxTasks) * chartHeight;
                        return (
                            <g key={i}>
                                <line
                                    x1={padding}
                                    y1={y}
                                    x2={width - padding}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={padding - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="text-xs fill-gray-500"
                                >
                                    {value}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill="url(#gradient)"
                        opacity="0.3"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                    />

                    {/* Data points */}
                    {points.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill="white"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                className="hover:r-7 transition-all cursor-pointer"
                            >
                                <title>{point.week.tasks_completed} tasks</title>
                            </circle>
                        </g>
                    ))}

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* X-axis */}
                    <line
                        x1={padding}
                        y1={height - padding}
                        x2={width - padding}
                        y2={height - padding}
                        stroke="#9ca3af"
                        strokeWidth="2"
                    />

                    {/* Y-axis */}
                    <line
                        x1={padding}
                        y1={padding}
                        x2={padding}
                        y2={height - padding}
                        stroke="#9ca3af"
                        strokeWidth="2"
                    />
                </svg>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                    <div className="text-2xl font-bold text-blue-600">
                        {timeline.length}
                    </div>
                    <div className="text-gray-600">Weeks Tracked</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">
                        {timeline.reduce((sum, w) => sum + w.tasks_completed, 0)}
                    </div>
                    <div className="text-gray-600">Total Tasks</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">
                        {(timeline.reduce((sum, w) => sum + w.tasks_completed, 0) / timeline.length).toFixed(1)}
                    </div>
                    <div className="text-gray-600">Avg Per Week</div>
                </div>
            </div>
        </div>
    );
};

export default ProgressTimelineChart;
