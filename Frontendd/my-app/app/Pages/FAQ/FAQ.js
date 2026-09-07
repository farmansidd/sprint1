"use client";
import React from 'react';

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Q: How do I create a new resume?</h2>
            <p className="text-gray-700">A: Navigate to the "Resume Builder" section from the main navigation. You can then fill in your personal information, experience, education, and other details. The live preview will show you how your resume looks as you build it.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Q: Can I track my learning progress?</h2>
            <p className="text-gray-700">A: Yes, visit the "Road Maps" section to see your learning roadmap, track pending and completed skills, and monitor your overall progress.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Q: Where can I find job listings?</h2>
            <p className="text-gray-700">A: The "Job Search" section allows you to search for jobs from various sources. You can use the search and filter options to find relevant positions.</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Q: How do I contact support?</h2>
            <p className="text-gray-700">A: You can reach our support team through the "Contact Support" link under "Help & Resources" in the navigation bar. Fill out the form, and we'll get back to you as soon as possible.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
