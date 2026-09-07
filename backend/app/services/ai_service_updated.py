"""
AI Service

Handles:
- Groq/LangChain AI calls
- Career roadmap generation
- Career suggestions
- JSON response extraction and validation
- Redis caching
- Model fallback handling
"""

import os
import json
import logging
import re
from typing import Any, Optional

import redis

from app.core import config

# LangChain / Groq
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Model selector
from app.services.ai_model_selector import (
    get_model_for_goal,
    ModelTier,
    get_fallback_models,
)


# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


# ============================================================================
# REDIS CONFIGURATION
# ============================================================================

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))


# ============================================================================
# REDIS CONNECTION
# ============================================================================

try:
    redis_client = redis.StrictRedis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True,
    )

    redis_client.ping()

    logger.info("Successfully connected to Redis.")

except redis.exceptions.ConnectionError as e:

    logger.error(f"Could not connect to Redis: {e}")

    redis_client = None


# ============================================================================
# GROQ API KEY
# ============================================================================

if not config.GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not set in environment variables."
    )


# ============================================================================
# DEFAULT MODEL
# ============================================================================

DEFAULT_MODEL = "openai/gpt-oss-20b"


# ============================================================================
# LLM FACTORY
# ============================================================================

def get_llm_instance(
    model_name: str = DEFAULT_MODEL,
    temperature: float = 0.2,
) -> ChatGroq:
    """
    Create a ChatGroq instance.

    JSON response format is requested so roadmap generation
    receives machine-readable output.
    """

    logger.info(
        f"Creating Groq LLM instance with model: {model_name}"
    )

    return ChatGroq(
        groq_api_key=config.GROQ_API_KEY,
        model=model_name,
        temperature=temperature,
        max_tokens=4096,


        # Ask the model for JSON where supported.
        model_kwargs={
            "response_format": {
                "type": "json_object"
            }
        },
    )


# ============================================================================
# DEFAULT LLM
# ============================================================================

llm = get_llm_instance()


# ============================================================================
# CUSTOM EXCEPTION
# ============================================================================

class AIResponseMalformedError(Exception):
    """Raised when the AI response cannot be converted into valid JSON."""

    pass


# ============================================================================
# AI RESPONSE CONTENT EXTRACTION
# ============================================================================

def extract_response_content(response: Any) -> str:
    """
    Extract usable text from a LangChain AIMessage.

    Different Groq/LangChain model versions can represent response
    content differently. This function handles:

    1. Normal string content
    2. List-based content blocks
    3. additional_kwargs content
    4. reasoning/content fields
    """

    if response is None:
        raise AIResponseMalformedError(
            "AI returned an empty response object."
        )

    # ------------------------------------------------------------------------
    # Primary content
    # ------------------------------------------------------------------------

    content = getattr(response, "content", None)

    if isinstance(content, str) and content.strip():
        logger.info(
            "AI response extracted from response.content"
        )

        return content.strip()

    # ------------------------------------------------------------------------
    # List-based LangChain content
    # ------------------------------------------------------------------------

    if isinstance(content, list):

        extracted_parts = []

        for block in content:

            if isinstance(block, str):
                extracted_parts.append(block)

            elif isinstance(block, dict):

                text = block.get("text")

                if isinstance(text, str):
                    extracted_parts.append(text)

                elif isinstance(block.get("content"), str):
                    extracted_parts.append(
                        block["content"]
                    )

        combined = "\n".join(
            part for part in extracted_parts if part
        ).strip()

        if combined:
            logger.info(
                "AI response extracted from list-based content."
            )

            return combined

    # ------------------------------------------------------------------------
    # additional_kwargs
    # ------------------------------------------------------------------------

    additional_kwargs = getattr(
        response,
        "additional_kwargs",
        None,
    )

    if isinstance(additional_kwargs, dict):

        possible_fields = [
            "content",
            "output",
            "text",
            "response",
            "reasoning_content",
        ]

        for field in possible_fields:

            value = additional_kwargs.get(field)

            if isinstance(value, str) and value.strip():

                logger.info(
                    f"AI response extracted from "
                    f"additional_kwargs['{field}']"
                )

                return value.strip()

    # ------------------------------------------------------------------------
    # Response dictionary fallback
    # ------------------------------------------------------------------------

    if isinstance(response, dict):

        possible_fields = [
            "content",
            "output",
            "text",
            "response",
            "reasoning_content",
        ]

        for field in possible_fields:

            value = response.get(field)

            if isinstance(value, str) and value.strip():

                return value.strip()

    # ------------------------------------------------------------------------
    # Nothing found
    # ------------------------------------------------------------------------

    logger.error(
        "AI response contained no usable text."
    )

    logger.error(
        f"Response type: {type(response)}"
    )

    logger.error(
        f"Response object: {response!r}"
    )

    raise AIResponseMalformedError(
        "AI returned an empty or unsupported response format."
    )


# ============================================================================
# JSON EXTRACTION
# ============================================================================

def clean_json_response(response: str) -> str:
    """
    Extract a valid JSON payload from an AI response.

    Handles:
    - Markdown code fences
    - Extra explanation
    - Leading/trailing text
    - Trailing commas
    - Root arrays containing levels
    - JSON objects embedded in text
    """

    if response is None:
        raise AIResponseMalformedError(
            "AI response is None."
        )

    if not isinstance(response, str):
        raise AIResponseMalformedError(
            f"AI response must be a string, got {type(response).__name__}."
        )

    response = response.strip()

    if not response:
        raise AIResponseMalformedError(
            "AI response is empty."
        )

    response = re.sub(
        r"^```(?:json)?\s*",
        "",
        response,
        flags=re.IGNORECASE,
    )

    response = re.sub(
        r"\s*```$",
        "",
        response,
    )

    response = response.strip()

    def _wrap_root(parsed):
        if isinstance(parsed, dict):
            return parsed

        if isinstance(parsed, list):
            return {
                "title": "Roadmap",
                "description": "A comprehensive technical roadmap.",
                "summary": "Technical learning roadmap.",
                "levels": parsed,
            }

        return None

    def _try_parse(candidate: str):
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            return None

        return _wrap_root(parsed)

    parsed = _try_parse(response)
    if parsed is not None:
        return json.dumps(parsed, ensure_ascii=False)

    for start_char in ("{", "["):
        for start_idx, ch in enumerate(response):
            if ch != start_char:
                continue

            depth = 0
            in_string = False
            escaped = False

            for idx in range(start_idx, len(response)):
                current = response[idx]

                if in_string:
                    if escaped:
                        escaped = False
                    elif current == "\\":
                        escaped = True
                    elif current == '"':
                        in_string = False
                    continue

                if current == '"':
                    in_string = True
                    continue

                if current == start_char:
                    depth += 1
                elif current == "}" and start_char == "{":
                    depth -= 1
                    if depth == 0:
                        candidate = response[start_idx:idx + 1]
                        parsed = _try_parse(candidate)
                        if parsed is not None:
                            return json.dumps(parsed, ensure_ascii=False)
                        break
                elif current == "]" and start_char == "[":
                    depth -= 1
                    if depth == 0:
                        candidate = response[start_idx:idx + 1]
                        parsed = _try_parse(candidate)
                        if parsed is not None:
                            return json.dumps(parsed, ensure_ascii=False)
                        break

    start_idx = response.find("{")
    end_idx = response.rfind("}")

    if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
        json_candidate = response[start_idx:end_idx + 1]
        json_candidate = re.sub(r",\s*([}\]])", r"\1", json_candidate)

        parsed = _try_parse(json_candidate)
        if parsed is not None:
            return json.dumps(parsed, ensure_ascii=False)

    raise AIResponseMalformedError(
        "No valid JSON object found in response."
    )


def normalize_roadmap_payload(response_data: Any) -> dict:
    """Normalize AI roadmap payloads that drift from the canonical schema."""

    if response_data is None:
        raise AIResponseMalformedError("AI response is empty.")

    if isinstance(response_data, list):
        response_data = {
            "title": "Roadmap",
            "description": "A comprehensive technical roadmap.",
            "summary": "Technical learning roadmap.",
            "levels": response_data,
        }

    if not isinstance(response_data, dict):
        raise AIResponseMalformedError(
            "AI response is not a JSON object or list of level objects."
        )

    normalized = dict(response_data)
    normalized["title"] = str(normalized.get("title") or "Roadmap")
    normalized["description"] = str(
        normalized.get("description")
        or "A comprehensive technical roadmap."
    )
    normalized["summary"] = str(
        normalized.get("summary") or "Technical learning roadmap."
    )

    raw_levels = normalized.get("levels", [])
    levels = raw_levels if isinstance(raw_levels, list) else [raw_levels]

    valid_levels = []
    for level_index, level in enumerate(levels, start=1):
        if not isinstance(level, dict):
            logger.warning(
                "Skipping invalid roadmap level at index %s: %r",
                level_index,
                level,
            )
            continue

        level_obj = dict(level)
        level_obj["name"] = str(level_obj.get("name") or f"Level {level_index}")

        raw_topics = level_obj.get("topics", [])
        topics = raw_topics if isinstance(raw_topics, list) else []
        valid_topics = []

        for topic_index, topic in enumerate(topics, start=1):
            if not isinstance(topic, dict):
                logger.warning(
                    "Skipping invalid topic at level %s, index %s: %r",
                    level_index,
                    topic_index,
                    topic,
                )
                continue

            topic_obj = dict(topic)
            topic_obj["name"] = str(topic_obj.get("name") or f"Topic {topic_index}")
            topic_obj["description"] = topic_obj.get("description") or ""

            raw_subtopics = topic_obj.get("subtopics", [])
            subtopics = raw_subtopics if isinstance(raw_subtopics, list) else []
            valid_subtopics = []

            for subtopic_index, subtopic in enumerate(subtopics, start=1):
                if not isinstance(subtopic, dict):
                    logger.warning(
                        "Skipping invalid subtopic at level %s, topic %s, index %s: %r",
                        level_index,
                        topic_index,
                        subtopic_index,
                        subtopic,
                    )
                    continue

                subtopic_obj = dict(subtopic)
                subtopic_obj["name"] = str(
                    subtopic_obj.get("name") or f"Subtopic {subtopic_index}"
                )
                subtopic_obj["description"] = subtopic_obj.get("description") or ""

                raw_skills = subtopic_obj.get("skills", [])
                skills = raw_skills if isinstance(raw_skills, list) else []
                valid_skills = []

                for skill_index, skill in enumerate(skills, start=1):
                    if not isinstance(skill, dict):
                        logger.warning(
                            "Skipping invalid skill at level %s, topic %s, subtopic %s, index %s: %r",
                            level_index,
                            topic_index,
                            subtopic_index,
                            skill_index,
                            skill,
                        )
                        continue

                    skill_obj = dict(skill)
                    if not skill_obj.get("name"):
                        continue

                    skill_obj["id"] = skill_obj.get("id") or f"t{skill_index}"
                    skill_obj["description"] = skill_obj.get("description") or skill_obj.get("name")
                    skill_obj["estimated_hours"] = int(skill_obj.get("estimated_hours") or 1)
                    difficulty = str(skill_obj.get("difficulty") or "medium").lower()
                    skill_obj["difficulty"] = difficulty if difficulty in {"low", "medium", "high"} else "medium"
                    skill_obj["depends_on"] = skill_obj.get("depends_on") if isinstance(skill_obj.get("depends_on"), list) else []
                    skill_obj["resources"] = skill_obj.get("resources") if isinstance(skill_obj.get("resources"), list) else []
                    skill_obj["status"] = str(skill_obj.get("status") or "not_started")
                    valid_skills.append(skill_obj)

                subtopic_obj["skills"] = valid_skills
                valid_subtopics.append(subtopic_obj)

            topic_obj["subtopics"] = valid_subtopics

            micro_project = topic_obj.get("micro_project")
            if not isinstance(micro_project, dict):
                topic_obj["micro_project"] = {
                    "title": f"{topic_obj['name']} Project",
                    "description": "Build a practical project using the concepts from this topic.",
                    "requirements": [],
                    "evaluation_criteria": [],
                    "starter_code": "",
                }
            else:
                topic_obj["micro_project"] = {
                    "title": str(micro_project.get("title") or f"{topic_obj['name']} Project"),
                    "description": str(micro_project.get("description") or "Build a practical project using the concepts from this topic."),
                    "requirements": micro_project.get("requirements") if isinstance(micro_project.get("requirements"), list) else [],
                    "evaluation_criteria": micro_project.get("evaluation_criteria") if isinstance(micro_project.get("evaluation_criteria"), list) else [],
                    "starter_code": micro_project.get("starter_code") or "",
                }

            valid_topics.append(topic_obj)

        level_obj["topics"] = valid_topics

        quiz = level_obj.get("quiz")
        if not isinstance(quiz, dict):
            quiz = {"questions": []}

        questions = quiz.get("questions", []) if isinstance(quiz.get("questions", []), list) else []
        valid_questions = []
        for question_index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                continue
            question_obj = dict(question)
            options = question_obj.get("options")
            if not isinstance(options, list) or len(options) == 0:
                question_obj["options"] = ["Option A", "Option B", "Option C", "Option D"]
            else:
                question_obj["options"] = [str(opt) for opt in options[:4]]
                if len(question_obj["options"]) < 4:
                    while len(question_obj["options"]) < 4:
                        question_obj["options"].append(f"Option {len(question_obj['options']) + 1}")
            question_obj["question"] = str(question_obj.get("question") or f"Quiz question {question_index}")
            question_obj["correct_answer"] = str(question_obj.get("correct_answer") or question_obj["options"][0])
            question_obj["explanation"] = str(question_obj.get("explanation") or "Understand the concept before continuing.")
            valid_questions.append(question_obj)

        level_obj["quiz"] = {"questions": valid_questions}

        micro_project = level_obj.get("micro_project")
        if not isinstance(micro_project, dict):
            level_obj["micro_project"] = {
                "title": f"{level_obj['name']} Project",
                "description": "Apply the concepts from this level in a practical challenge.",
                "requirements": [],
                "evaluation_criteria": [],
                "starter_code": "",
            }
        else:
            level_obj["micro_project"] = {
                "title": str(micro_project.get("title") or f"{level_obj['name']} Project"),
                "description": str(micro_project.get("description") or "Apply the concepts from this level in a practical challenge."),
                "requirements": micro_project.get("requirements") if isinstance(micro_project.get("requirements"), list) else [],
                "evaluation_criteria": micro_project.get("evaluation_criteria") if isinstance(micro_project.get("evaluation_criteria"), list) else [],
                "starter_code": micro_project.get("starter_code") or "",
            }

        valid_levels.append(level_obj)

    if not valid_levels:
        raise AIResponseMalformedError(
            "AI response produced no valid roadmap levels after normalization."
        )

    normalized["levels"] = valid_levels
    return normalized


# ============================================================================
# AI MODEL CALL
# ============================================================================

async def _call_ai_model(
    messages: list,
    model_name: str = DEFAULT_MODEL,
) -> str:
    """
    Call Groq through LangChain and return text content.

    Includes model fallback handling.
    """

    models_to_try = [model_name]

    # Add fallback models
    try:

        fallback_models = get_fallback_models(
            model_name
        )

        for fallback in fallback_models:

            if fallback not in models_to_try:
                models_to_try.append(fallback)

    except Exception as e:

        logger.warning(
            f"Could not load fallback models: {e}"
        )

    last_error = None

    # =========================================================================
    # Try each model
    # =========================================================================

    for current_model in models_to_try:

        try:

            logger.info(
                f"Calling Groq model: {current_model}"
            )

            # ----------------------------------------------------------------
            # Convert messages to LangChain format
            # ----------------------------------------------------------------

            langchain_messages = []

            for msg in messages:

                role = msg.get("role")
                content = msg.get("content", "")

                if role == "system":

                    langchain_messages.append(
                        SystemMessage(
                            content=content
                        )
                    )

                elif role == "user":

                    langchain_messages.append(
                        HumanMessage(
                            content=content
                        )
                    )

            # ----------------------------------------------------------------
            # Create model
            # ----------------------------------------------------------------

            model_llm = get_llm_instance(
                model_name=current_model,
                temperature=0.2,
            )

            # ----------------------------------------------------------------
            # Invoke
            # ----------------------------------------------------------------

            response = await model_llm.ainvoke(
                langchain_messages
            )

            logger.info(
                f"Received response from model: {current_model}"
            )

            # ----------------------------------------------------------------
            # Extract response
            # ----------------------------------------------------------------

            content = extract_response_content(
                response
            )

            if not content.strip():

                raise AIResponseMalformedError(
                    f"Model {current_model} returned empty content."
                )

            logger.info(
                f"AI content length: {len(content)} characters"
            )

            logger.debug(
                f"AI content preview: {content[:500]}"
            )

            return content

        except Exception as e:

            last_error = e

            logger.error(
                f"Error calling AI model "
                f"{current_model}: {e}",
                exc_info=True,
            )

            # Continue to next fallback model
            continue

    # =========================================================================
    # All models failed
    # =========================================================================

    raise Exception(
        "All configured AI models failed. "
        f"Last error: {last_error}"
    )


# ============================================================================
# ROADMAP GENERATION
# ============================================================================

async def generate_roadmap_from_goal(
    career_goal: str,
    skill_level: str = "intermediate",
    weekly_hours: int = 10,
    holland_code: Optional[str] = None,
    personality_traits: Optional[dict] = None,
) -> dict:
    """
    Generate a structured technical learning roadmap.
    """

    # ------------------------------------------------------------------------
    # Sanitize input
    # ------------------------------------------------------------------------

    if not career_goal:

        raise ValueError(
            "Career goal cannot be empty."
        )

    career_goal = career_goal.strip()

    # ------------------------------------------------------------------------
    # Select model
    # ------------------------------------------------------------------------

    selected_model, complexity = get_model_for_goal(
        career_goal,
        skill_level,
    )

    logger.info(
        f"Using model: {selected_model} "
        f"for complexity: {complexity.value}"
    )

    # ------------------------------------------------------------------------
    # Skill guidance
    # ------------------------------------------------------------------------

    skill_level_guidance = {

        "beginner": (
            "Focus on fundamentals with detailed explanations. "
            "Use simple terminology. "
            "Include foundational programming concepts and "
            "allow more learning time."
        ),

        "intermediate": (
            "Balance fundamentals with advanced concepts. "
            "Assume basic programming knowledge. "
            "Provide practical and production-oriented depth."
        ),

        "advanced": (
            "Focus on advanced concepts, architecture, "
            "performance, security, best practices, "
            "and real-world production applications."
        ),
    }

    guidance = skill_level_guidance.get(
        skill_level.lower(),
        skill_level_guidance["intermediate"],
    )

    # ------------------------------------------------------------------------
    # Psychometric context
    # ------------------------------------------------------------------------

    psych_context = ""

    if holland_code and personality_traits:

        psych_context = f"""
### Psychometric Personalization

Holland Code:
{holland_code}

Personality Traits:
{json.dumps(personality_traits, ensure_ascii=False)}

Tailor practical projects to the user's profile.

Learning Style:
Adjust explanations and project types according to the
personality profile.

Project Focus:
Make micro-projects practical and relevant to the user's
technical interests.

Tone:
Keep descriptions aligned with the user's profile.
"""

    # =========================================================================
    # SYSTEM PROMPT
    # =========================================================================

    system_prompt = f"""
You are an expert technical instructor and software engineering
curriculum designer.

Your task is to generate a structured technical learning roadmap
for the following career goal:

{career_goal}

User skill level:
{skill_level.upper()}

Skill-level guidance:
{guidance}

{psych_context}

IMPORTANT OUTPUT RULES:

1. Return ONLY valid JSON.
2. Do not return Markdown.
3. Do not use ```json fences.
4. Do not provide explanations before or after the JSON.
5. The root JSON value MUST be an object.
6. The root object MUST contain:
   - title
   - description
   - summary
   - levels

CONTENT RULES:

1. Focus exclusively on technical skills.
2. Do not include soft skills.
3. Do not include generic career advice.
4. Break large topics into concrete learnable concepts.
5. Include fundamentals, intermediate concepts, advanced concepts,
   implementation details, best practices, and common mistakes.
6. Every skill MUST contain:
   - id
   - name
   - description
   - estimated_hours
   - difficulty
   - depends_on
   - resources
7. estimated_hours MUST be a number.
8. difficulty MUST be one of:
   - low
   - medium
   - high
9. Task IDs MUST be unique and sequential:
   t1, t2, t3, t4, ...
10. Every level MUST contain a quiz.
11. Every quiz MUST contain exactly 5 questions.
12. Every level MUST contain a micro_project.
13. Every topic MUST contain a micro_project.
14. Resources should use useful official documentation URLs
    whenever possible.

QUIZ RULES:

Each quiz question must contain:

- question
- options
- correct_answer
- explanation

Each question MUST have exactly 4 options.

ROADMAP JSON STRUCTURE:

{{
  "title": "string",
  "description": "string",
  "summary": "string",
  "levels": [
    {{
      "name": "string",
      "topics": [
        {{
          "name": "string",
          "description": "string",

          "micro_project": {{
            "title": "string",
            "description": "string",
            "requirements": ["string"],
            "evaluation_criteria": ["string"],
            "starter_code": "string"
          }},

          "subtopics": [
            {{
              "name": "string",
              "description": "string",

              "skills": [
                {{
                  "id": "t1",
                  "name": "string",
                  "description": "string",
                  "estimated_hours": 2,
                  "difficulty": "low",
                  "depends_on": [],
                  "resources": [
                    {{
                      "title": "string",
                      "url": "https://example.com"
                    }}
                  ]
                }}
              ]
            }}
          ]
        }}
      ],

      "quiz": {{
        "questions": [
          {{
            "question": "string",
            "options": [
              "string",
              "string",
              "string",
              "string"
            ],
            "correct_answer": "string",
            "explanation": "string"
          }}
        ]
      }},

      "micro_project": {{
        "title": "string",
        "description": "string",
        "requirements": ["string"],
        "evaluation_criteria": ["string"],
        "starter_code": "string"
      }}
    }}
  ]
}}

QUALITY REQUIREMENTS:

Generate a comprehensive roadmap, but ensure the final output
remains valid JSON.

Do not leave fields empty unless they are legitimately not
applicable.

Make the roadmap directly relevant to the career goal.
"""

    # =========================================================================
    # USER PROMPT
    # =========================================================================

    user_prompt = f"""
Generate the technical learning roadmap now.

Career goal:
{career_goal}

Skill level:
{skill_level}

Weekly study time:
{weekly_hours} hours

Return ONLY the JSON object.
"""

    prompt_messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]

    # =========================================================================
    # CACHE
    # =========================================================================

    cache_key = (
        f"roadmap_goal:{career_goal}"
        f":level:{skill_level}"
        f":hours:{weekly_hours}"
        f":v4"
    )

    if redis_client:

        try:

            cached_response = redis_client.get(
                cache_key
            )

            if cached_response:

                logger.info(
                    f"Returning cached roadmap for "
                    f"'{career_goal}'"
                )

                return json.loads(
                    cached_response
                )

        except Exception as e:

            logger.warning(
                f"Redis read failed: {e}"
            )

    # =========================================================================
    # GENERATE ROADMAP
    # =========================================================================

    ai_content = None
    cleaned_content = None

    try:

        logger.info(
            f"Attempting to generate roadmap for "
            f"goal: '{career_goal}' "
            f"with model: {selected_model}"
        )

        ai_content = await _call_ai_model(
            prompt_messages,
            selected_model,
        )

        # --------------------------------------------------------------------
        # Log raw response
        # --------------------------------------------------------------------

        logger.info(
            f"Raw AI response length: "
            f"{len(ai_content)} characters"
        )

        logger.debug(
            f"Raw AI response preview:\n"
            f"{ai_content[:1000]}"
        )

        # --------------------------------------------------------------------
        # Clean JSON
        # --------------------------------------------------------------------

        cleaned_content = clean_json_response(
            ai_content
        )

        logger.info(
            f"Cleaned JSON length: "
            f"{len(cleaned_content)} characters"
        )

        # --------------------------------------------------------------------
        # Parse JSON
        # --------------------------------------------------------------------

        response_data = json.loads(
            cleaned_content
        )

        # --------------------------------------------------------------------
        # Normalize and validate root payload
        # --------------------------------------------------------------------

        response_data = normalize_roadmap_payload(response_data)

        response_data["title"] = (
            response_data.get("title") or f"Roadmap for {career_goal}"
        )

        response_data["description"] = (
            response_data.get("description")
            or f"A comprehensive technical roadmap for {career_goal}."
        )

        response_data["summary"] = (
            response_data.get("summary")
            or f"Technical learning roadmap for {career_goal}."
        )

        # --------------------------------------------------------------------
        # Validate levels without crashing on variable-length responses
        # --------------------------------------------------------------------

        for level_index, level in enumerate(
            response_data["levels"],
            start=1,
        ):
            if not isinstance(level, dict):
                logger.warning(
                    "Skipping invalid level entry at index %s: %r",
                    level_index,
                    level,
                )
                continue

            level["name"] = str(level.get("name") or f"Level {level_index}")
            level["topics"] = level.get("topics") if isinstance(level.get("topics"), list) else []
            level["quiz"] = level.get("quiz") if isinstance(level.get("quiz"), dict) else {"questions": []}
            level["micro_project"] = level.get("micro_project") if isinstance(level.get("micro_project"), dict) else {
                "title": f"Level {level_index} Project",
                "description": (
                    "Complete a practical project using the skills learned in this level."
                ),
                "requirements": [],
                "evaluation_criteria": [],
                "starter_code": "",
            }

        # --------------------------------------------------------------------
        # Cache successful response
        # --------------------------------------------------------------------

        if redis_client:

            try:

                redis_client.setex(
                    cache_key,
                    3600,
                    json.dumps(
                        response_data,
                        ensure_ascii=False,
                    ),
                )

                logger.info(
                    f"Cached roadmap for "
                    f"'{career_goal}'"
                )

            except Exception as e:

                logger.warning(
                    f"Redis write failed: {e}"
                )

        logger.info(
            f"Successfully generated roadmap for "
            f"goal: '{career_goal}' "
            f"with model: {selected_model}"
        )

        return response_data

    # =========================================================================
    # JSON ERROR
    # =========================================================================

    except json.JSONDecodeError as e:

        logger.error(
            f"JSON parsing failed for "
            f"'{career_goal}': {e}"
        )

        if ai_content:

            logger.error(
                f"Raw AI content:\n"
                f"{ai_content[:3000]}"
            )

        if cleaned_content:

            logger.error(
                f"Cleaned content:\n"
                f"{cleaned_content[:3000]}"
            )

        raise Exception(
            f"Failed to parse JSON from AI response. "
            f"Reason: {e}"
        )

    # =========================================================================
    # MALFORMED RESPONSE
    # =========================================================================

    except AIResponseMalformedError as e:

        logger.error(
            f"AI response malformed for "
            f"'{career_goal}'. "
            f"Reason: {e}"
        )

        if ai_content:

            logger.error(
                f"Raw AI content:\n"
                f"{ai_content[:3000]}"
            )

        raise Exception(
            f"AI response is malformed. "
            f"Reason: {e}"
        )

    # =========================================================================
    # GENERAL ERROR
    # =========================================================================

    except Exception as e:

        logger.error(
            f"Unexpected error generating roadmap "
            f"for '{career_goal}': {e}",
            exc_info=True,
        )

        raise Exception(
            f"Failed to generate valid roadmap from AI. "
            f"Reason: {e}"
        )


# ============================================================================
# CAREER SUGGESTIONS
# ============================================================================

async def generate_career_suggestions(
    holland_code: str,
    traits: dict,
    experienced_skills: list = None,
    model_name: str = DEFAULT_MODEL,
) -> dict:
    """
    Generate career suggestions from a psychometric profile
    and existing technical skills.
    """

    skill_context = ""

    if experienced_skills:

        skill_context = (
            "User's Existing Technical Skills: "
            + ", ".join(experienced_skills)
        )

    prompt = f"""
User's Holland Code:
{holland_code}

User's Personality Traits:
{json.dumps(traits, ensure_ascii=False)}

{skill_context}

Based on this profile, suggest 5 aligned technology career roles.

For each role provide:

1. Role title
2. One sentence description
3. Why it fits the user's profile
4. Match score between 0.0 and 1.0

Return ONLY valid JSON.

Required format:

{{
  "analysis": "Brief analysis",
  "suggested_careers": [
    {{
      "role": "string",
      "description": "string",
      "fit_reason": "string",
      "match_score": 0.95
    }}
  ]
}}
"""

    messages = [
        {
            "role": "system",
            "content": (
                "You are a career psychologist and "
                "technology industry expert. "
                "Return only valid JSON."
            ),
        },
        {
            "role": "user",
            "content": prompt,
        },
    ]

    try:

        ai_content = await _call_ai_model(
            messages,
            model_name,
        )

        cleaned_content = clean_json_response(
            ai_content
        )

        result = json.loads(
            cleaned_content
        )

        if not isinstance(result, dict):

            raise AIResponseMalformedError(
                "Career suggestions response is not an object."
            )

        return result

    except Exception as e:

        logger.error(
            f"Error generating career suggestions: {e}",
            exc_info=True,
        )

        raise