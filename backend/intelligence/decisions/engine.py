
from learning_state.models import LearningState

def recommend_next_task(state: LearningState) -> str:
    """
    Determines the next best task based on Velocity and Mastery.
    Output: Task ID or Description String
    """
    
    # 1. Check Velocity Band
    velocity = state.current_velocity_band
    mastery = state.mastery_level
    
    # Simple Rule-Based Logic
    if velocity == "STALLED":
        if mastery == "Beginner":
            return "Review: Python Basics Quiz" # Go back to basics
        else:
            return "Review: Debugging Practice" # You are good but stuck, maybe debug?
            
    elif velocity == "SLOW":
        return "Practice: Small Python Script" # Build momentum
        
    elif velocity == "FAST":
        if mastery == "Expert":
             return "Challenge: Advanced Asyncio Project" # Push limit
        else:
             return "next_logical_task" # Continue roadmap
             
    else: # NORMAL
        return "next_logical_task"
