"use client";
import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import { getRoadmaps } from '../../../lib/roadmapApi';
import { Loader2, Brain } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [latestRoadmapId, setLatestRoadmapId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestRoadmap = async () => {
      try {
        const roadmaps = await getRoadmaps();
        if (roadmaps && roadmaps.length > 0) {
          // Assuming the last roadmap is the latest one
          setLatestRoadmapId(roadmaps[roadmaps.length - 1].id);
        }
      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
        setError("Could not load analytics. No roadmap found.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRoadmap();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-purple-600" />
              Your Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Deep dive into your learning patterns and progress.
            </p>
          </div>

          {user?.holland_code && (
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-purple-100 flex items-center">
              <span className="text-sm text-gray-500 mr-2">Personality Type:</span>
              <span className="font-bold text-purple-600 tracking-wider">{user.holland_code}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl shadow-sm border">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Loading Analytics...</h2>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 bg-red-50 rounded-2xl border border-red-200">
            <p>{error}</p>
          </div>
        ) : latestRoadmapId ? (
          <AnalyticsDashboard roadmapId={latestRoadmapId} />
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white rounded-2xl shadow-sm border">
            <p>No roadmap found. Please create a roadmap to see your analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
