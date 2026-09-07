/**
 * Integration Guide for Roadmap.js
 * 
 * This file shows how to integrate the new components into the existing Roadmap.js
 * Follow these steps to add skill-level calibration and analytics to your roadmap page.
 */

// ============================================================================
// STEP 1: Add imports at the top of Roadmap.js
// ============================================================================

import { useState, useEffect } from 'react';
import RoadmapGenerateModal from '../components/RoadmapGenerateModal';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { 
  getRoadmap, 
  updateTaskStatus, 
  getRoadmapMilestones,
  createRoadmapMilestones 
} from '../../lib/roadmapApi';

// ============================================================================
// STEP 2: Add state variables (replace mock data)
// ============================================================================

const RoadmapPage = () => {
  // Replace mock data with real state
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [milestones, setMilestones] = useState([]);

  // ============================================================================
  // STEP 3: Fetch roadmap data on component mount
  // ============================================================================

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        // Get roadmap ID from URL or localStorage
        const roadmapId = 1; // Replace with actual ID
        
        const roadmapData = await getRoadmap(roadmapId);
        setRoadmap(roadmapData);
        
        // Fetch milestones
        const milestonesData = await getRoadmapMilestones(roadmapId);
        setMilestones(milestonesData);
      } catch (error) {
        console.error('Error fetching roadmap:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, []);

  // ============================================================================
  // STEP 4: Update task completion handler to call API
  // ============================================================================

  const handleTaskComplete = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    
    try {
      // Optimistic update
      // Update local state immediately for better UX
      
      // Call API
      await updateTaskStatus(taskId, newStatus);
      
      // Refresh roadmap data to get updated progress
      const roadmapId = roadmap.id;
      const updatedRoadmap = await getRoadmap(roadmapId);
      setRoadmap(updatedRoadmap);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert optimistic update on error
    }
  };

  // ============================================================================
  // STEP 5: Add roadmap generation handler
  // ============================================================================

  const handleRoadmapGenerated = (newRoadmap) => {
    setRoadmap(newRoadmap);
    
    // Auto-generate milestones
    createRoadmapMilestones(newRoadmap.id)
      .then(setMilestones)
      .catch(console.error);
  };

  // ============================================================================
  // STEP 6: Add UI elements to the JSX
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Generate Button */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {roadmap?.title || 'My Roadmap'}
            </h1>
            <p className="text-gray-600 mt-1">
              {roadmap?.description || 'Your personalized learning path'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
            >
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
            >
              Generate New Roadmap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Analytics Dashboard */}
        {showAnalytics && roadmap && (
          <div className="mb-6">
            <AnalyticsDashboard 
              roadmapId={roadmap.id} 
              weeklyHours={10} 
            />
          </div>
        )}

        {/* Milestones Section */}
        {milestones.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Milestones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{milestone.name}</h3>
                    <span className="text-sm text-gray-600">
                      {milestone.completed_tasks}/{milestone.total_tasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{milestone.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing roadmap content */}
        {/* Keep your existing skills list, phases, etc. */}
        {/* Just update the checkbox handlers to use handleTaskComplete */}
      </div>

      {/* Modals */}
      <RoadmapGenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onRoadmapGenerated={handleRoadmapGenerated}
      />
    </div>
  );
};

// ============================================================================
// STEP 7: Update task checkbox to call API
// ============================================================================

// Find the checkbox in your existing code and update it:
/*
<button
  onClick={() => handleTaskComplete(skill.id, skill.status)}
  className="..."
>
  {skill.status === 'completed' ? <CheckSquare /> : <Square />}
</button>
*/

// ============================================================================
// NOTES
// ============================================================================

/*
1. The roadmap data structure from the API includes:
   - id, title, description, goal
   - topics[] with subtopics[] and skills[]
   - progress_percent, estimated_time_minutes
   - skill_level, version_number

2. Each skill has:
   - id, name, description, status
   - estimated_time_minutes, difficulty
   - depends_on[], resources[]
   - phase (Fundamentals/Applied/Project)

3. Remember to handle loading states and errors

4. You can add more features like:
   - Version history modal
   - Quiz generation
   - Resource links display
   - Dependency visualization
*/

export default RoadmapPage;
