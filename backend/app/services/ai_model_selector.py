"""
AI Model Selector Service
Handles multi-model orchestration, complexity analysis, and fallback strategies.
"""

import logging
from typing import Tuple
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelTier(Enum):
    """AI model tiers based on capability and cost, using Groq models."""

    LIGHTWEIGHT = "openai/gpt-oss-20b"
    STANDARD = "openai/gpt-oss-120b"
    ADVANCED = "openai/gpt-oss-120b"


class ComplexityLevel(Enum):
    """Input complexity levels."""

    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


def analyze_input_complexity(
    goal: str,
    skill_level: str = "intermediate"
) -> ComplexityLevel:
    """Analyze the complexity of the user's goal."""

    goal_lower = goal.lower()
    word_count = len(goal.split())

    advanced_keywords = [
        "architect",
        "system design",
        "distributed",
        "microservices",
        "machine learning",
        "ai",
        "deep learning",
        "blockchain",
        "kubernetes",
        "devops",
        "cloud native",
        "scalability",
        "security",
        "optimization",
    ]

    intermediate_keywords = [
        "full-stack",
        "backend",
        "frontend",
        "api",
        "database",
        "web development",
        "mobile",
        "react",
        "python",
        "java",
        "node",
        "django",
        "sql",
    ]

    advanced_count = sum(
        1 for keyword in advanced_keywords
        if keyword in goal_lower
    )

    intermediate_count = sum(
        1 for keyword in intermediate_keywords
        if keyword in goal_lower
    )

    complexity_score = 0

    if word_count > 20:
        complexity_score += 2
    elif word_count > 10:
        complexity_score += 1

    complexity_score += advanced_count * 2
    complexity_score += intermediate_count

    if skill_level == "advanced":
        complexity_score += 2
    elif skill_level == "intermediate":
        complexity_score += 1

    if complexity_score >= 6:
        return ComplexityLevel.COMPLEX
    elif complexity_score >= 3:
        return ComplexityLevel.MODERATE
    else:
        return ComplexityLevel.SIMPLE


def select_model(complexity: ComplexityLevel) -> ModelTier:
    """Select the appropriate AI model based on complexity."""

    model_mapping = {
        ComplexityLevel.SIMPLE: ModelTier.LIGHTWEIGHT,
        ComplexityLevel.MODERATE: ModelTier.STANDARD,
        ComplexityLevel.COMPLEX: ModelTier.ADVANCED,
    }

    selected_model = model_mapping.get(
        complexity,
        ModelTier.STANDARD
    )

    logger.info(
        f"Selected model: {selected_model.value} "
        f"for complexity: {complexity.value}"
    )

    return selected_model


def get_model_for_goal(
    goal: str,
    skill_level: str = "intermediate"
) -> Tuple[str, ComplexityLevel]:
    """Get the appropriate model for a given goal."""

    complexity = analyze_input_complexity(
        goal,
        skill_level
    )

    model_enum = select_model(complexity)

    logger.info(
        f"Goal: '{goal}' | "
        f"Skill Level: {skill_level} | "
        f"Complexity: {complexity.value} | "
        f"Model: {model_enum.value}"
    )

    return model_enum.value, complexity


def get_best_model(task_type: str = "general") -> str:
    """
    Get the best model for a specific task type.

    Args:
        task_type: Type of task such as quiz_generation or coding.

    Returns:
        Groq model name.
    """

    if task_type == "quiz_generation":
        return ModelTier.STANDARD.value

    elif task_type == "coding":
        return ModelTier.ADVANCED.value

    if task_type == "creative":
        return ModelTier.STANDARD.value

    return ModelTier.STANDARD.value


def get_fallback_models(primary_model: str) -> list[str]:
    """
    Return fallback models excluding the primary model.
    """
    fallback_models = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ]

    return [
        model
        for model in fallback_models
        if model != primary_model
    ]