"use client";
import React, { useState, useEffect } from 'react';
import ResumeForm from './ResumeForm';
import ResumePreview from './ResumePreview';
import { Download, Wand2, Palette } from 'lucide-react';

const INITIAL_DATA = {
  personalInfo: { fullName: '', jobTitle: '', email: '', phone: '', location: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: []
};

const THEMES = [
  { id: 'theme-1.css', name: 'Corporate' },
  { id: 'theme-2.css', name: 'Minimalist' },
  { id: 'theme-3.css', name: 'Creative' },
  { id: 'theme-4.css', name: 'Technical' },
  { id: 'theme-5.css', name: 'Elegant' },
];

const ResumeBuilder = () => {
  // Load from local storage or use initial data
  const [resumeData, setResumeData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('careerforge_resume_data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    }
    return INITIAL_DATA;
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('careerforge_active_theme') || 'theme-1.css';
    }
    return 'theme-1.css';
  });


  // Persist to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerforge_resume_data', JSON.stringify(resumeData));
      localStorage.setItem('careerforge_active_theme', activeTheme);
    }
  }, [resumeData, activeTheme]);

  const handleDataChange = (section, value) => {
    setResumeData(prev => ({ ...prev, [section]: value }));
  };

  const handleEnhanceText = () => {
    // Mock Implementation for now
    alert("Enhance Text Feature: This would call an LLM API to improve your summary and bullet points.");
    // In a real implementation:
    // 1. Collect all text fields
    // 2. Send to API
    // 3. Show Modal with Diffs
  };

  const handleDownloadPDF = () => {
    // Simple window.print() solution as a robust fallback/MVP
    // A specific print stylesheet should handle the hiding of UI elements
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-800 font-sans">
      {/* Print Styles */}
      <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .resume-preview-container { box-shadow: none !important; border: none !important; }
                }
            `}</style>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
            CareerForge Resume Builder
          </h1>
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                <Palette size={18} />
                <span>Theme: {THEMES.find(t => t.id === activeTheme)?.name}</span>
              </button>
              {/* Theme Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block p-1">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTheme(theme.id)}
                    className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${activeTheme === theme.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleEnhanceText} className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors font-medium">
              <Wand2 size={18} />
              <span className="hidden sm:inline">Enhance Text</span>
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all font-medium transform hover:-translate-y-0.5">
              <Download size={18} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor Column */}
          <div className="lg:col-span-5 space-y-6 no-print overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar pr-2">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4 text-sm text-blue-800 flex items-start gap-2">
              <div className="mt-1 min-w-[16px]">💡</div>
              <p>Fill out the details below. The preview will update automatically. Use the "Enhance Text" button to polish your writing.</p>
            </div>
            <ResumeForm data={resumeData} onChange={handleDataChange} onSectionChange={handleDataChange} />
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <ResumePreview data={resumeData} activeTheme={activeTheme} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;
