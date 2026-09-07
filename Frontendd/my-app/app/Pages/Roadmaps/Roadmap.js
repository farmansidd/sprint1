"use client";
import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Square, Bot, Target, TrendingUp, Clock, Award, Zap, X, Send, User, Play, Sparkles, Trophy, Flame, BookOpen, ArrowRight, Lightbulb, ChevronRight, MapPin, Activity, FileText, BarChart3, Loader2, GraduationCap, Code
} from 'lucide-react';
import RoadmapGenerateModal from '../../components/RoadmapGenerateModal';
import RoadmapGenerator from '../../components/RoadmapGenerator';
import QuizModal from '../../components/QuizModal';
import ProjectSubmissionModal from '../../components/ProjectSubmissionModal';
import AssessmentProgress from '../../components/AssessmentProgress';
import TopicCard from '../../components/TopicCard';
import UpNextVideo from '../../components/UpNextVideo';
import { getRoadmaps, updateTaskStatus, createRoadmapMilestones, getRoadmapMilestones } from '../../../lib/roadmapApi';
import { getTopicCompletion } from '../../../lib/quizApi';

const RoadmapPage = () => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hi! I\'m your AI learning assistant. How can I help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // New Integration State
  const [currentRoadmap, setCurrentRoadmap] = useState(null);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [completedSkills, setCompletedSkills] = useState([]);
  const [roadmapPhases, setRoadmapPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [milestones, setMilestones] = useState([]);

  // Assessment state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLevelAssessment, setIsLevelAssessment] = useState(false);
  const [topicCompletions, setTopicCompletions] = useState({});

  // Fetch initial data
  useEffect(() => {
    fetchLatestRoadmap();
  }, []);

  const fetchLatestRoadmap = async () => {
    try {
      setLoading(true);
      const roadmaps = await getRoadmaps();
      if (roadmaps && roadmaps.length > 0) {
        const latest = roadmaps[roadmaps.length - 1];
        processRoadmapData(latest);
      } else {
        setCurrentRoadmap(null);
      }
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/auth/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const isPreviousLevelCompleted = (levels, currentIndex) => {
    if (currentIndex === 0) return true;
    const prevLevel = levels[currentIndex - 1];
    // Check if previous level quiz and project are done (or just quiz if project optional)
    // For now, let's assume if quiz is passed, level is effectively "unlocked" next one
    // But ideally it should be: prevLevel topics complete + prevLevel Quiz Pass + prevLevel Project (if exists) Pass
    return isQuizPassed(prevLevel.quiz, topicCompletions);
  };

  const areAllTopicsCompleted = (topics, completedSkillsList) => {
    // Check if all skills in these topics are completed
    // This is expensive, better to enforce topic.completed flag from backend
    // For now: check if topic progress is 100%
    return topics.every(topic => {
      const topicId = topic.id;
      // Find skills for this topic
      // Simplified: Assume topic completion from backend is reliable
      return topicCompletions[topicId]?.completed;
    });
  };

  const isQuizPassed = (quiz, completions) => {
    if (!quiz) return true; // No quiz = passed
    // We need to match quiz stats from completions. 
    // Issue: Completions are per TOPIC in current state, but now Quiz is per LEVEL.
    // Backend needs to return Level completions or we check QuizAttempt separately.
    // For Phase 1: Let's assume we fetch QuizAttempts or we store level status.
    // Hack: Check if we have a passing score for this quiz ID in some state.
    // Let's assume we will fetch level completions later.
    return true; // Placeholder to not block UI
  };

  const processRoadmapData = async (roadmapData) => {
    const safeRoadmap = roadmapData && typeof roadmapData === 'object' ? roadmapData : {};
    setCurrentRoadmap(safeRoadmap);
    // Clear existing state before processing to prevent duplication
    const pending = [];
    const completed = [];
    const phases = [];

    // Fetch topic completions
    await fetchTopicCompletions(safeRoadmap);

    const processTopics = (topics) => {
      if (!Array.isArray(topics)) return;

      topics.forEach((topic, topicIdx) => {
        if (!topic || typeof topic !== 'object') return;

        let topicProgress = 0;
        let topicTotal = 0;
        let topicCompleted = 0;

        if (Array.isArray(topic.subtopics)) {
          topic.subtopics.forEach(subtopic => {
            if (!subtopic || typeof subtopic !== 'object') return;
            if (Array.isArray(subtopic.skills)) {
              subtopic.skills.forEach(skill => {
                if (!skill || typeof skill !== 'object') return;
                topicTotal++;
                const skillObj = {
                  uniqueId: `${topic.id || topicIdx}-${subtopic.id || topicIdx}-${skill.id || topicIdx}`,
                  id: skill.id,
                  name: skill.name,
                  category: topic.name,
                  estimatedTime: formatTime(skill.estimated_time_minutes || (skill.estimated_hours ? skill.estimated_hours * 60 : null)),
                  completed: skill.status === 'completed',
                  status: skill.status || 'not_started'
                };

                if (skill.status === 'completed') {
                  completed.push(skillObj);
                  topicCompleted++;
                } else {
                  pending.push(skillObj);
                }
              });
            }
          });
        }
      });
    };

    const roadmapLevels = Array.isArray(safeRoadmap.levels) ? safeRoadmap.levels.filter(level => level && typeof level === 'object') : [];
    const topLevelTopics = Array.isArray(safeRoadmap.topics) ? safeRoadmap.topics.filter(topic => topic && typeof topic === 'object') : [];

    if (roadmapLevels.length > 0) {
      // If we have levels, ONLY process topics within levels
      roadmapLevels.forEach(level => {
        if (Array.isArray(level.topics)) processTopics(level.topics);
      });
    } else if (topLevelTopics.length > 0) {
      // Fallback: If no levels, process top-level topics
      processTopics(topLevelTopics);
    }

    // ... rest of existing logic ...
    setPendingSkills(pending);
    setCompletedSkills(completed);
    setRoadmapPhases(phases);

    if (roadmapData.id) {
      try {
        const milestonesData = await getRoadmapMilestones(roadmapData.id);
        setMilestones(milestonesData || []);
      } catch (e) {
        console.log("No milestones found or error fetching them");
      }
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours`;
  };

  const completionRate = pendingSkills.length + completedSkills.length > 0 ? (completedSkills.length / (pendingSkills.length + completedSkills.length)) * 100 : 0;

  const handleWatch = async (videoId) => {
    if (!videoId) return;
    setVideoLoading(true);
    setSelectedVideoId(videoId);
    requestAnimationFrame(() => setVideoLoading(false));
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, { id: Date.now(), role: 'user', content: newMessage }, { id: Date.now() + 1, role: 'assistant', content: 'That\'s a great question! Let me help you with that...' }]);
      setNewMessage('');
    }
  };

  const handleTaskToggle = async (skillUniqueId, skillId, currentStatus) => {
    const isCompleted = currentStatus === 'completed';
    const newStatus = isCompleted ? 'not_started' : 'completed';

    const skill = isCompleted ? completedSkills.find(s => s.uniqueId === skillUniqueId) : pendingSkills.find(s => s.uniqueId === skillUniqueId);
    if (!skill) return;

    if (isCompleted) {
      setCompletedSkills(prev => prev.filter(s => s.uniqueId !== skillUniqueId));
      setPendingSkills(prev => [...prev, { ...skill, completed: false, status: 'not_started' }]);
    } else {
      setPendingSkills(prev => prev.filter(s => s.uniqueId !== skillUniqueId));
      setCompletedSkills(prev => [...prev, { ...skill, completed: true, status: 'completed' }]);
    }

    try {
      await updateTaskStatus(skillId, newStatus);
    } catch (error) {
      console.error("Failed to update task status:", error);
      if (isCompleted) {
        setPendingSkills(prev => prev.filter(s => s.uniqueId !== skillUniqueId));
        setCompletedSkills(prev => [...prev, { ...skill, completed: true, status: 'completed' }]);
      } else {
        setCompletedSkills(prev => prev.filter(s => s.uniqueId !== skillUniqueId));
        setPendingSkills(prev => [...prev, { ...skill, completed: false, status: 'not_started' }]);
      }
      alert(`Error: ${error.response?.data?.detail || error.message || "Failed to update task status."}`);
    }
  };

  const handleRoadmapGenerated = (newRoadmap) => {
    processRoadmapData(newRoadmap);
    if (newRoadmap.id) {
      createRoadmapMilestones(newRoadmap.id).then(setMilestones).catch(console.error);
    }
    setShowGenerateModal(false);
  };

  const fetchTopicCompletions = async (roadmapData) => {
    const completions = {};
    const topicsToFetch = [];
    const roadmapLevels = Array.isArray(roadmapData?.levels) ? roadmapData.levels.filter(level => level && typeof level === 'object') : [];
    const topLevelTopics = Array.isArray(roadmapData?.topics) ? roadmapData.topics.filter(topic => topic && typeof topic === 'object') : [];

    if (roadmapLevels.length > 0) {
      roadmapLevels.forEach(level => {
        if (Array.isArray(level.topics)) {
          level.topics.forEach(topic => {
            if (topic && typeof topic === 'object') topicsToFetch.push(topic);
          });
        }
      });
    } else if (topLevelTopics.length > 0) {
      topLevelTopics.forEach(topic => topicsToFetch.push(topic));
    }

    for (const topic of topicsToFetch) {
      try {
        const completion = await getTopicCompletion(topic.id);
        if (completion) {
          completions[topic.id] = completion;
        }
      } catch (err) {
        // No completion yet, which is fine
      }
    }

    setTopicCompletions(completions);
  };

  const handleQuizClick = (topic) => {
    setSelectedTopic(topic);
    setIsLevelAssessment(false);
    setShowQuizModal(true);
  };

  const handleProjectClick = (topic) => {
    setSelectedTopic(topic);
    setIsLevelAssessment(false);
    setShowProjectModal(true);
  };

  const handleQuizCompleted = async (result) => {
    // Refresh topic completion
    if (selectedTopic) {
      const completion = await getTopicCompletion(selectedTopic.id);
      setTopicCompletions(prev => ({
        ...prev,
        [selectedTopic.id]: completion
      }));
    }
    setShowQuizModal(false);
  };

  const handleProjectCompleted = async (result) => {
    // Refresh topic completion
    if (selectedTopic) {
      const completion = await getTopicCompletion(selectedTopic.id);
      setTopicCompletions(prev => ({
        ...prev,
        [selectedTopic.id]: completion
      }));
    }
    setShowProjectModal(false);
  };

  const handleLevelQuizClick = (level) => {
    setSelectedTopic({ id: level.id, name: level.name });
    setIsLevelAssessment(true);
    setShowQuizModal(true);
  };

  const handleLevelProjectClick = (level) => {
    setSelectedTopic({
      id: level.id,
      name: level.name,
      micro_project: level.micro_project
    });
    setIsLevelAssessment(true);
    setShowProjectModal(true);
  };

  const ProgressOverview = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center space-x-6">
      <div className="relative">
        <svg className="w-24 h-24" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e6e6e6" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="54" fill="none" stroke="#4f46e5" strokeWidth="12"
            strokeDasharray={`${(completionRate / 100) * 339.29} 339.29`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{`${completionRate.toFixed(0)}%`}</span>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Roadmap Progress</h2>
        <p className="text-gray-600 mt-1">{completedSkills.length} of {pendingSkills.length + completedSkills.length} skills completed.</p>
        <div className="flex space-x-4 mt-3 text-sm">
          <div><span className="font-semibold">{pendingSkills.length}</span> Pending</div>
          <div><span className="font-semibold">{completedSkills.length}</span> Completed</div>
        </div>
      </div>
    </div>
  );
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading your roadmap...</h2>
        </div>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-8">
        <RoadmapGenerator onRoadmapGenerated={handleRoadmapGenerated} />
      </div>
    );
  }

  const roadmapLevels = Array.isArray(currentRoadmap?.levels) ? currentRoadmap.levels.filter(level => level && typeof level === 'object') : [];
  const topLevelTopics = Array.isArray(currentRoadmap?.topics) ? currentRoadmap.topics.filter(topic => topic && typeof topic === 'object') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 p-6 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentRoadmap.title}
          </h1>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate New Roadmap
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <ProgressOverview />

            {/* Levels & Curriculum */}
            {roadmapLevels.length > 0 ? (
              <div className="space-y-8">
                {roadmapLevels.map((level, index) => {
                  const levelTopics = Array.isArray(level.topics) ? level.topics.filter(topic => topic && typeof topic === 'object') : [];
                  const isLevelUnlocked = index === 0 || isPreviousLevelCompleted(roadmapLevels, index);
                  const isQuizUnlocked = isLevelUnlocked; // Quiz unlocked when level is unlocked
                  const isProjectUnlocked = isLevelUnlocked; // Project unlocked when level is unlocked (can be refined later)

                  return (
                    <div key={level.id || index} className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 ${!isLevelUnlocked ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <span className="text-blue-700 font-bold">{index + 1}</span>
                          </div>
                          {level.name}
                        </h2>
                        {isLevelUnlocked ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Unlocked</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Locked</span>
                        )}
                      </div>

                      {/* Topics List */}
                      <div className="grid grid-cols-1 gap-4 mb-6">
                        {levelTopics.map((topic) => (
                          <TopicCard
                            key={topic.id}
                            topic={topic}
                            roadmapId={currentRoadmap.id}
                            completion={topicCompletions[topic.id]}
                            onQuizClick={handleQuizClick}
                            onProjectClick={handleProjectClick}
                          />
                        ))}
                      </div>

                      {/* Level Assessment Moved to Sidebar */}
                    </div>
                  );
                })}
              </div>
            ) : topLevelTopics.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Topics & Assessments
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {topLevelTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      roadmapId={currentRoadmap.id}
                      completion={topicCompletions[topic.id]}
                      onQuizClick={handleQuizClick}
                      onProjectClick={handleProjectClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skills Checklist */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
                Skills Checklist
              </h2>
              {pendingSkills.length > 0 ? (
                <div className="space-y-3">
                  {pendingSkills.map((skill) => (
                    <SkillItem key={skill.uniqueId} skill={skill} onToggle={handleTaskToggle} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No pending skills. You're all caught up!</div>
              )}
            </div>

        

            {/* Completed Skills */}
            {completedSkills.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-green-600" />
                  Completed Skills ({completedSkills.length})
                </h2>
                <div className="space-y-3">
                  {completedSkills.map((skill) => (
                    <SkillItem key={skill.uniqueId} skill={skill} onToggle={handleTaskToggle} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Up Next Card */}
            {pendingSkills.length > 0 && (
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-2 flex items-center"><Lightbulb className="w-5 h-5 mr-2" />Up Next</h3>
                <p className="font-semibold text-lg mb-1">{pendingSkills[0].name}</p>
                <p className="text-sm opacity-90 mb-4">Category: {pendingSkills[0].category}</p>
                <UpNextVideo topicName={pendingSkills[0].name} onPlay={handleWatch} />
              </div>
            )}

            {/* Chatbot Card */}
            {showChatbot && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-[500px] flex flex-col">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 mr-2" />
                    <span className="font-semibold">AI Assistant</span>
                  </div>
                  <button onClick={() => setShowChatbot(false)} className="hover:bg-blue-700 p-1 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask for help..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-sm text-black" />
                    <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!showChatbot && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-2">Need help?</h3>
                <p className="mb-4 text-gray-600">Our AI assistant is here to guide you.</p>
                <button
                  onClick={() => setShowChatbot(true)}
                  className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            )}

            {/* Assessment Sidebar (Quiz & Project for Active Level) */}
            {roadmapLevels.length > 0 && (() => {
              // Determine Active Level
              const activeLevelIndex = roadmapLevels.findIndex((l, idx) => !isPreviousLevelCompleted(roadmapLevels, idx + 1));
              // Logic: find first level where *next* level is locked? No.
              // Find first level where THIS level is unlocked but not fully complete?
              // Simplified: Find first level where `isPreviousLevelCompleted` is true (unlocked) AND it's not the last one?
              // Let's use the layout logic:
              const activeLevel = roadmapLevels.find((level, index) => {
                const unlocked = index === 0 || isPreviousLevelCompleted(roadmapLevels, index);
                // We want the highest unlocked level? Or the first incomplete one?
                // Let's pick the last unlocked level.
                if (!unlocked) return false;
                // If it's the last level, return true.
                if (index === roadmapLevels.length - 1) return true;
                // If next level is LOCKED, then THIS is the active level.
                const nextUnlocked = isPreviousLevelCompleted(roadmapLevels, index + 1);
                return !nextUnlocked;
              }) || roadmapLevels[0];

              // Re-use logic for button states
              const isQuizUnlocked = true; // Since it's the active level
              const isProjectUnlocked = true;

              return (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-600" />
                      Current Focus: {activeLevel.name}
                    </h3>

                    {/* Validated Quiz Card */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                          Quiz
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Available</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{activeLevel.quiz?.questions?.length || 0} questions</p>
                      <button
                        onClick={() => handleLevelQuizClick(activeLevel)}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Take Quiz
                      </button>
                    </div>

                    {/* Validated Project Card */}
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Code className="w-5 h-5 mr-2 text-purple-600" />
                          Project
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Ready</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-1">{activeLevel.micro_project?.title || "Project Challenge"}</p>
                      <button
                        onClick={() => handleLevelProjectClick(activeLevel)}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Submit Project
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {selectedVideoId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-black w-full max-w-4xl aspect-video rounded-xl overflow-hidden relative shadow-2xl">
            <button onClick={() => setSelectedVideoId(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"><X className="w-8 h-8" /></button>
            {videoLoading ? (
              <div className="w-full h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div></div>
            ) : (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${encodeURIComponent(selectedVideoId)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`}
                title="Course Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      )}

      <RoadmapGenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onRoadmapGenerated={handleRoadmapGenerated}
      />

      {selectedTopic && (
        <>
          <QuizModal
            isOpen={showQuizModal}
            onClose={() => setShowQuizModal(false)}
            assessmentId={selectedTopic.id}
            roadmapId={currentRoadmap?.id}
            topicName={selectedTopic.name}
            onQuizCompleted={handleQuizCompleted}
            isLevel={isLevelAssessment}
          />

          <ProjectSubmissionModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            assessmentId={selectedTopic.id}
            roadmapId={currentRoadmap?.id}
            topicName={selectedTopic.name}
            onSubmissionCompleted={handleProjectCompleted}
            isLevel={isLevelAssessment}
            projectDetails={selectedTopic.micro_project}
          />
        </>
      )}
    </div>
  );
};

const SkillItem = ({ skill, onToggle }) => (
  <div className={`border border-gray-200 rounded-lg p-4 transition-colors ${skill.completed ? 'bg-gray-50 opacity-75' : 'hover:border-blue-300'}`}>
    <div className="flex items-center space-x-3">
      <button onClick={() => onToggle(skill.uniqueId, skill.id, skill.status)} className={`${skill.completed ? 'text-green-600' : 'text-gray-400 hover:text-blue-600'} transition-colors`}>
        {skill.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
      </button>
      <div className="flex-1">
        <h3 className={`font-medium ${skill.completed ? 'text-gray-900 line-through' : 'text-gray-900'}`}>{skill.name}</h3>
        <div className="flex items-center space-x-4 mt-1">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {skill.category}
          </span>
          <span className="text-xs text-gray-600 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {skill.estimatedTime}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default RoadmapPage;