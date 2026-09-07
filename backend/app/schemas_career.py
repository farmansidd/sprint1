from pydantic import BaseModel
from typing import List, Dict, Optional

class PsychProfileSubmit(BaseModel):
    holland_code: str
    personality_traits: Dict[str, float]  # e.g., {"openness": 0.8, "extraversion": 0.6}

class CareerSuggestion(BaseModel):
    role: str
    description: str
    fit_reason: str
    match_score: Optional[float] = None

class CareerExplorationResult(BaseModel):
    analysis: str
    suggested_careers: List[CareerSuggestion]
