"use client";
import React from 'react';

const GuidesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Guides & Tutorials</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Getting Started with CareerForge.ai</h2>
            <p className="text-gray-700">Learn the basics of navigating the platform, setting up your profile, and understanding the core features.</p>
            <a href="#!" className="text-blue-600 hover:underline mt-2 block">Read Guide</a>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Mastering the Resume Builder</h2>
            <p className="text-gray-700">A comprehensive guide to using all features of the resume builder, including advanced tips for optimizing your resume for ATS.</p>
            <a href="#!" className="text-blue-600 hover:underline mt-2 block">Watch Tutorial</a>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Effective Job Search Strategies</h2>
            <p className="text-gray-700">Discover strategies for finding the right job opportunities using our Job Search feature, tailoring your applications, and preparing for interviews.</p>
            <a href="#!" className="text-blue-600 hover:underline mt-2 block">Download E-book</a>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Personalized Learning Roadmaps</h2>
            <p className="text-gray-700">Understand how to create and utilize personalized learning roadmaps to acquire new skills and advance your career.</p>
            <a href="#!" className="text-blue-600 hover:underline mt-2 block">Explore More</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidesPage;
