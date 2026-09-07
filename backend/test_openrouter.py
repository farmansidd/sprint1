#!/usr/bin/env python3
"""
Test script for OpenRouter API integration
"""

import asyncio
import json
import os
from dotenv import load_dotenv
from app.services.ai_service import generate_roadmap_from_goal

# Load environment variables
load_dotenv()

async def test_openrouter_integration():
    """Test the OpenRouter API integration"""
    
    print("🧪 Testing OpenRouter API Integration")
    print("=" * 50)
    
    # Check if API key is set
    api_key = os.getenv("AI_API_KEY")
    if not api_key or api_key == "your-openrouter-api-key-here":
        print("❌ Error: AI_API_KEY is not set or is a placeholder")
        print("   Please update your .env file with a valid OpenRouter API key")
        return
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    # Test cases
    test_goals = [
        "Become a Software Engineer",
        "Learn Data Science",
        "Start a career in Cybersecurity"
    ]
    
    for goal in test_goals:
        print(f"\n🎯 Testing goal: {goal}")
        try:
            result = await generate_roadmap_from_goal(goal)
            print(f"✅ Success! Generated roadmap with {len(result.get('roadmap', {}).get('topics', []))} topics")
            
            # Save result for inspection
            filename = f"test_roadmap_{goal.replace(' ', '_').lower()}.json"
            with open(filename, 'w') as f:
                json.dump(result, f, indent=2)
            print(f"📄 Saved to: {filename}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n🎉 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_openrouter_integration())
