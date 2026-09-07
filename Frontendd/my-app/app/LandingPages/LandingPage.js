import React from 'react';
import Link from 'next/link';

import {
  ArrowRight, Linkedin, Twitter, Github,
  Target, TrendingUp, Award, BarChart3, Briefcase,
  CheckCircle, Clock, FileText , Lightbulb 
} from 'lucide-react';

const CareerForgeLanding = () => {
  const companyLogos = [
    { name: "Google", url: "https://careers.google.com" },
    { name: "Microsoft", url: "https://careers.microsoft.com" },
    { name: "Stripe", url: "https://stripe.com/jobs" },
    { name: "Amazon", url: "https://amazon.jobs" },
    { name: "Meta", url: "https://metacareers.com" },
    { name: "Apple", url: "https://apple.com/careers" },
    { name: "Netflix", url: "https://jobs.netflix.com" },
    { name: "Tesla", url: "https://tesla.com/careers" }
  ];
    // Color style mappings for Tailwind (must use complete class names)
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-600',
      buttonText: 'text-blue-600 hover:text-blue-700',
      gradientBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
      avatarBg: 'bg-blue-200',
      avatarBorder: 'border-blue-600'
    },
    emerald: {
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      buttonText: 'text-emerald-600 hover:text-emerald-700',
      gradientBg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      avatarBg: 'bg-emerald-200',
      avatarBorder: 'border-emerald-600'
    },
    purple: {
      iconBg: 'bg-purple-50',
      iconText: 'text-purple-600',
      buttonText: 'text-purple-600 hover:text-purple-700',
      gradientBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
      avatarBg: 'bg-purple-200',
      avatarBorder: 'border-purple-600'
    }
  };

  const features = [
  {
    title: "Adaptive Roadmaps",
    description: "AI continuously updates your learning path based on your progress, market trends, and emerging technologies—never outdated.",
    icon: Target,
    color: "blue",
    stats: "1,247 active learners"
  },
  {
    title: "Skill Gap Analysis",
    description: "Scans your profile against job requirements and identifies exactly what to learn next, with prioritized recommendations.",
    icon: TrendingUp,
    color: "emerald",
    stats: "High Priority: React.js"
  },
  {
    title: "Real-Time Feedback",
    description: "Get instant AI-powered feedback on your projects, code, and resumes—learn faster with actionable insights.",
    icon: Award,
    color: "purple",
    stats: "3 improvements identified"
  }
];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative w-full max-w-7xl mx-auto">
          <div className="text-center">
            {/* Logo */}
             {/* <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="absolute -inset-1 bg-cyan-500 rounded-full blur opacity-55 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Lightbulb className="relative text-blue-400 text-3xl animate-pulse-slow" />
          </div>
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
            CareerForge<span className="text-cyan-300">.ai</span>
          </span>
        </Link> */}

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight max-w-5xl mx-auto">
              Build Your Career with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Learning
              </span>
              {' '}& Direct Job Access
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Create personalized career roadmaps, build optimized resumes, and apply directly to company job postings—all in one platform. No recruiters, no noise.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link href="/auth/register">
                <button className="group flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:scale-105 hover:shadow-2xl transition-all font-semibold text-lg shadow-lg">
                  Start Free Roadmap
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button className="flex items-center px-8 py-4 bg-white text-gray-900 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:scale-105 hover:shadow-xl transition-all font-semibold text-lg">
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Strip */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueStripItem 
              icon={<BarChart3 className="w-6 h-6" />}
              text="Monitor skills, courses, and milestones in real-time"
              label="Track Progress"
            />
            <ValueStripItem 
              icon={<Award className="w-6 h-6" />}
              text="AI analyzes job descriptions and optimizes your resume"
              label="Build Resumes"
            />
            <ValueStripItem 
              icon={<Briefcase className="w-6 h-6" />}
              text="Find jobs and apply on company websites—skip the middleman"
              label="Apply Direct"
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Advance Your Career
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three powerful tools working together to help you learn, showcase your skills, and land your next role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CapabilityCard 
              icon={<Target className="w-6 h-6" />}
              title="Career Roadmap & Progress Tracking"
              description="Set career goals and get a step-by-step roadmap with recommended courses, certifications, and skill benchmarks. Track your progress with visual timelines and completion metrics."
              ctaText="Start Your Roadmap"
            />
            <CapabilityCard 
              icon={<FileText className="w-6 h-6" />}
              title="AI Resume Builder"
              description="Upload a job posting, and our AI tailors your resume to match requirements—highlighting relevant skills, rewriting bullets, and formatting for ATS systems."
              ctaText="Build Resume Now"
            />
            <CapabilityCard 
              icon={<Briefcase className="w-6 h-6" />}
              title="Job Matching & Direct Apply"
              description="Search jobs matched to your profile and apply directly on employer websites. We provide direct links—no third-party platforms, no spam."
              ctaText="Find Jobs"
            />
          </div>
        </div>
      </section>

      {/* Roadmap Detail Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                See Your Career Path, Step by Step
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                CareerForge generates a custom roadmap based on your target role. You'll see:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Required skills mapped to free/paid courses</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Certification timelines with exam prep resources</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Weekly goals and progress dashboards</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Real-time updates as you complete milestones</span>
                </li>
              </ul>
              <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Create Free Roadmap
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Frontend Engineer Roadmap</h3>
                  <span className="text-sm text-blue-600 font-medium">67% Complete</span>
                </div>
                <div className="space-y-3">
                  <RoadmapItem title="React Fundamentals" status="completed" />
                  <RoadmapItem title="State Management" status="completed" />
                  <RoadmapItem title="TypeScript Basics" status="current" />
                  <RoadmapItem title="System Design" status="upcoming" />
                  <RoadmapItem title="Testing & CI/CD" status="upcoming" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Detail Section */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Before AI</span>
                  <span className="text-sm font-semibold text-red-600">ATS Score: 64%</span>
                </div>
                <div className="bg-gray-50 rounded p-4 text-sm text-gray-600 border border-gray-200">
                  <p className="mb-2 opacity-50">• Worked on frontend projects</p>
                  <p className="opacity-50">• Used React and JavaScript</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">After AI Optimization</span>
                  <span className="text-sm font-semibold text-green-600">ATS Score: 94%</span>
                </div>
                <div className="bg-blue-50 rounded p-4 text-sm text-gray-700 border border-blue-200">
                  <p className="mb-2">• Architected responsive web applications using <strong>React</strong> and <strong>TypeScript</strong>, improving load times by 40%</p>
                  <p>• Implemented state management with <strong>Redux</strong>, enhancing user experience for 50K+ monthly active users</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                AI That Reads Job Postings and Rewrites Your Resume
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Paste any job URL. Our AI extracts requirements and:
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Matches your experience to job keywords</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Rewrites bullet points for impact and ATS compatibility</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Suggests missing skills to add or learn</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Outputs PDF and .docx formats</span>
                </li>
              </ul>
              <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Try Resume Builder
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Detail Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Direct Links to Company Job Postings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Stop scrolling LinkedIn's crowded feeds. We aggregate open roles and provide direct links to company career pages—no recruiter spam, just real postings.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <p className="text-center text-sm text-gray-600 mb-6 font-medium">
              Apply directly at these companies and thousands more
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
              {companyLogos.map((company, idx) => (
                <a
                  key={idx}
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
                  aria-label={`Apply at ${company.name}`}
                >
                  <span className="text-sm font-semibold text-gray-700">{company.name}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Search Open Roles
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Action Panel */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Choose your first action:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Create Resume
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Start Roadmap
              </button>
              <button className="px-6 py-3 bg-white text-gray-900 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors font-semibold">
                Find Jobs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Learning Showcase */}
   <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-24">
                    {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            const styles = colorStyles[feature.color];
            
            return (
              <div 
                key={index} 
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}
              >
                {/* Text Content Side */}
                <div className="flex-1 space-y-6">
                  <div className={`inline-flex p-3 rounded-xl ${styles.iconBg} ${styles.iconText}`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {feature.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <button className={`group inline-flex items-center font-semibold ${styles.buttonText} transition-colors`}>
                    Learn more 
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Visual/Card Side */}
                <div className="flex-1 w-full">
                  <div className={`relative rounded-3xl p-8 overflow-hidden shadow-2xl ${styles.gradientBg} transform transition-transform duration-500 hover:scale-[1.02]`}>
                    
                    {/* Decorative Background Blobs */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

                    {/* Glassmorphism Card Content */}
                    <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <p className="text-white text-lg font-medium leading-relaxed">
                        {feature.title === "Adaptive Roadmaps" && "Your roadmap evolves as you learn, incorporating new skills."}
                        {feature.title === "Skill Gap Analysis" && "Get a clear list of skills you need, ranked by importance."}
                        {feature.title === "Real-Time Feedback" && "Upload your work and receive detailed, constructive feedback."}
                      </p>
                      
                      <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/10">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full ${styles.avatarBg} border-2 ${styles.avatarBorder}`} />
                          ))}
                        </div>
                        <span className="text-white/90 text-sm font-medium">{feature.stats}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Roadmap Builder</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Resume AI</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Job Search</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Data Methodology</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy & Transparency</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">hello@careerforge.ai</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Data Usage</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center space-x-2 group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-cyan-500 rounded-full blur opacity-55 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Lightbulb className="relative text-blue-400 text-xl animate-pulse-slow" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight">
                  CareerForge<span className="text-cyan-300">.ai</span>
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                © 2024 CareerForge.ai — All rights reserved
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component Helpers
const ValueStripItem = ({ icon, text, label }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg text-blue-600 mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
    <p className="text-sm text-gray-600">{text}</p>
  </div>
);

const CapabilityCard = ({ icon, title, description, ctaText }) => (
  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:scale-105 transition-all">
    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
    <a href="#" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors">
      {ctaText}
      <ArrowRight className="ml-2 w-4 h-4" />
    </a>
  </div>
);

const RoadmapItem = ({ title, status }) => {
  const statusConfig = {
    completed: { color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle className="w-5 h-5" /> },
    current: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock className="w-5 h-5" /> },
    upcoming: { color: 'text-gray-400', bg: 'bg-gray-50', icon: <Clock className="w-5 h-5 opacity-50" /> }
  };
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center justify-between p-3 rounded bg-gray-50">
      <span className="text-sm text-gray-700">{title}</span>
      <div className={`flex items-center justify-center w-8 h-8 rounded ${config.bg} ${config.color}`}>
        {config.icon}
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, sublabel }) => (
  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-lg text-blue-600 mb-4">
      {icon}
    </div>
    <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
    <div className="text-gray-700 font-medium mb-1">{label}</div>
    <div className="text-sm text-gray-500">{sublabel}</div>
  </div>
);

const LearningFeatureCard = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default CareerForgeLanding;
