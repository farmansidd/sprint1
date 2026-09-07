from fastapi import APIRouter, HTTPException, status
import requests
from youtube_transcript_api import YouTubeTranscriptApi
import os
from app.services.ai_service_updated import _call_ai_model

router = APIRouter()

# TODO: Replace "YOUR_API_KEY" with your actual YouTube Data API key.
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "YOUR_API_KEY")

@router.get("/search-video")
async def search_video(query: str):
    if YOUTUBE_API_KEY == "YOUR_API_KEY":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="YouTube API key is not configured."
        )
        
    url = (
        f"https://www.googleapis.com/youtube/v3/search"
        f"?part=snippet&type=video&order=relevance&videoDuration=long&maxResults=5"
        f"&q={query}&key={YOUTUBE_API_KEY}"
    )
    try:
        res = requests.get(url)
        res.raise_for_status()
        data = res.json()

        if "items" not in data or not data["items"]:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No videos found")

        # Basic ranking: pick first result
        best_video = data["items"][0]
        return {
            "videoId": best_video["id"]["videoId"],
            "title": best_video["snippet"]["title"],
            "description": best_video["snippet"]["description"],
        }
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to YouTube API: {e}")


@router.post("/explain-video")
async def explain_video(videoId: str, user_query: str = None):
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(videoId)
        transcript_text = " ".join([t["text"] for t in transcript_list])
    except Exception:
        transcript_text = "Transcript not available."

    prompt_messages = [
        {"role": "system", "content": "You are an AI assistant that explains educational videos. Summarize the provided transcript and answer any specific user questions."},
        {"role": "user", "content": f"""
        Summarize this YouTube video tutorial transcript:
        {transcript_text}

        User asked: {user_query or "Summarize the key points."}
        """}
    ]

    try:
        explanation = await _call_ai_model(prompt_messages)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get explanation from AI model: {e}")
