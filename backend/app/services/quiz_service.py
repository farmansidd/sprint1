"""
Quiz Generation and Assessment Service

Generates AI-powered quizzes for roadmap topics and handles quiz grading.
"""

from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Quiz, QuizQuestion, QuizAttempt, Topic, TopicCompletion
from app.services.ai_service_updated import _call_ai_model
from langchain_core.messages import HumanMessage, SystemMessage
import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage, SystemMessage

from app.models import Quiz, QuizQuestion, QuizAttempt, Topic, TopicCompletion, Level
from app.services.ai_service_updated import _call_ai_model


class QuizService:
    """Service for generating and grading quizzes"""

    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_quiz_for_level(self, level_id: int, roadmap_id: int) -> Quiz:
        """
        Generate a 5-question quiz for a given level using AI

        Args:
            level_id: The level to generate quiz for
            roadmap_id: The roadmap this level belongs to

        Returns:
            Quiz: The generated quiz with questions
        """
        # Get level details
        result = await self.db.execute(select(Level).where(Level.id == level_id))
        level = result.scalar_one_or_none()
        if not level:
            raise ValueError(f"Level {level_id} not found")

        # Check if quiz already exists
        result = await self.db.execute(
            select(Quiz).where(
                Quiz.level_id == level_id,
                Quiz.roadmap_id == roadmap_id
            )
        )
        existing_quiz = result.scalar_one_or_none()

        if existing_quiz:
            return existing_quiz
        
        # Generate quiz using AI
        system_prompt = """You are an expert quiz generator for technical learning topics.
Generate exactly 5 multiple-choice questions that test understanding of the given level.

For each question:
- Make it practical and relevant
- Provide 4 answer options (A, B, C, D)
- Indicate the correct answer
- Include a brief explanation

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct"
  }
]"""

        user_prompt = f"""Level: {level.name}

Generate 5 multiple-choice questions to assess understanding of this level."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Use the updated AI service
        response_content = await _call_ai_model(messages, "openai/gpt-oss-120b")

        # Parse AI response
        try:
            # Extract JSON from response (handle markdown code blocks)
            content = response_content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            questions_data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response: {e}")
        
        # Create quiz in database
        quiz = Quiz(
            roadmap_id=roadmap_id,
            level_id=level_id,
            section_name=level.name
        )
        self.db.add(quiz)

        await self.db.flush()
        
        # Add questions
        for idx, q_data in enumerate(questions_data[:5]):  # Ensure only 5 questions
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=q_data["question"],
                options=q_data["options"],
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation", ""),
                order_index=idx
            )
            self.db.add(question)
        
        await self.db.commit()
        await self.db.refresh(quiz)
        
        return quiz

    async def generate_quiz_for_topic(self, topic_id: int, roadmap_id: int) -> Quiz:
        """
        Generate a 5-question quiz for a given topic using AI

        Args:
            topic_id: The topic to generate quiz for
            roadmap_id: The roadmap this topic belongs to

        Returns:
            Quiz: The generated quiz with questions
        """
        # Get topic details
        result = await self.db.execute(select(Topic).where(Topic.id == topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            raise ValueError(f"Topic {topic_id} not found")

        # Check if quiz already exists
        result = await self.db.execute(
            select(Quiz).where(
                Quiz.section_id == str(topic_id),
                Quiz.roadmap_id == roadmap_id
            )
        )
        existing_quiz = result.scalar_one_or_none()

        if existing_quiz:
            return existing_quiz
        
        # Generate quiz using AI
        system_prompt = """You are an expert quiz generator for technical learning topics.
Generate exactly 5 multiple-choice questions that test understanding of the given topic.

For each question:
- Make it practical and relevant
- Provide 4 answer options (A, B, C, D)
- Indicate the correct answer
- Include a brief explanation

Return ONLY a valid JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct"
  }
]"""

        user_prompt = f"""Topic: {topic.name}
Description: {topic.description}

Generate 5 multiple-choice questions to assess understanding of this topic."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Use the updated AI service
        response_content = await _call_ai_model(messages, "openai/gpt-oss-120b")

        # Parse AI response
        try:
            # Extract JSON from response (handle markdown code blocks)
            content = response_content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            questions_data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response: {e}")
        
        # Create quiz in database
        quiz = Quiz(
            roadmap_id=roadmap_id,
            section_id=str(topic_id),
            section_name=topic.name
        )
        self.db.add(quiz)

        await self.db.flush()
        
        # Add questions
        for idx, q_data in enumerate(questions_data[:5]):  # Ensure only 5 questions
            question = QuizQuestion(
                quiz_id=quiz.id,
                question=q_data["question"],
                options=q_data["options"],
                correct_answer=q_data["correct_answer"],
                explanation=q_data.get("explanation", ""),
                order_index=idx
            )
            self.db.add(question)
        
        await self.db.commit()
        await self.db.refresh(quiz)
        
        return quiz
    
    async def submit_quiz_attempt(
        self,
        user_id: int,
        quiz_id: int,
        roadmap_id: int,
        answers: Dict[int, str],
        level_id: int = None,
        topic_id: int = None,
    ) -> QuizAttempt:
        """
        Submit a quiz attempt and calculate score

        Args:
            user_id: User taking the quiz
            quiz_id: Quiz being attempted
            roadmap_id: Roadmap ID for analytics
            answers: Dict mapping question_id -> answer (e.g., "A", "B", etc.)
            level_id: Level ID for analytics
            topic_id: Topic ID for analytics

        Returns:
            QuizAttempt: The graded attempt
        """
        # Get quiz with questions
        result = await self.db.execute(select(Quiz).where(Quiz.id == quiz_id))
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise ValueError(f"Quiz {quiz_id} not found")

        # Get questions for this quiz
        result = await self.db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id))
        questions = result.scalars().all()

        # Calculate score
        correct_count = 0
        total_questions = len(questions)

        for question in questions:
            user_answer = answers.get(str(question.id), "").strip().upper()
            correct_answer = question.correct_answer.strip().upper()

            # Handle both "A" and "A)" formats
            if user_answer.endswith(")"):
                user_answer = user_answer[0]
            if correct_answer.endswith(")"):
                correct_answer = correct_answer[0]

            if user_answer == correct_answer:
                correct_count += 1

        score = correct_count  # Score out of 5

        # Create attempt record
        attempt = QuizAttempt(
            user_id=user_id,
            topic_id=topic_id,
            level_id=level_id,
            roadmap_id=roadmap_id,
            quiz_id=quiz_id,
            score=score,
            max_score=total_questions,
            answers=answers
        )
        self.db.add(attempt)

        # Update topic completion
        if topic_id:
            await self._update_topic_completion(user_id, topic_id, roadmap_id, quiz_score=score)
        if level_id:
            await self._update_level_completion(user_id, level_id, roadmap_id, quiz_score=score)

        await self.db.commit()
        await self.db.refresh(attempt)

        return attempt
    
    async def _update_level_completion(
        self,
        user_id: int,
        level_id: int,
        roadmap_id: int,
        quiz_score: float = None,
        project_score: float = None
    ):
        """Update level completion status based on quiz and project scores"""

        from app.models import LevelCompletion # Import here to avoid circular dependency if models imports QuizService

        # Get or create level completion record
        result = await self.db.execute(
            select(LevelCompletion).where(
                LevelCompletion.user_id == user_id,
                LevelCompletion.level_id == level_id,
                LevelCompletion.roadmap_id == roadmap_id
            )
        )
        completion = result.scalar_one_or_none()

        if not completion:
            completion = LevelCompletion(
                user_id=user_id,
                level_id=level_id,
                roadmap_id=roadmap_id,
                quiz_score=quiz_score,
                project_score=project_score,
                combined_score=0.0
            )
            self.db.add(completion)
        else:
            if quiz_score is not None:
                completion.quiz_score = quiz_score
            if project_score is not None:
                completion.project_score = project_score

        # Calculate combined score (weighted: 40% quiz, 60% project)
        quiz_normalized = (completion.quiz_score / 5.0) if completion.quiz_score is not None else 0
        project_normalized = completion.project_score if completion.project_score is not None else 0

        if completion.quiz_score is not None and completion.project_score is not None:
            completion.combined_score = (quiz_normalized * 0.4) + (project_normalized * 0.6)
        elif completion.quiz_score is not None:
            completion.combined_score = quiz_normalized
        elif completion.project_score is not None:
            completion.combined_score = project_normalized

        # Mark as completed if combined score >= 0.7 (70%)
        if completion.combined_score >= 0.7:
            completion.completed = True
            if not completion.completed_at:
                completion.completed_at = datetime.now()

        await self.db.commit()
    
    async def _update_topic_completion(
        self,
        user_id: int,
        topic_id: int,
        roadmap_id: int,
        quiz_score: float = None,
        project_score: float = None
    ):
        """Update topic completion status based on quiz and project scores"""

        # Get or create topic completion record
        result = await self.db.execute(
            select(TopicCompletion).where(
                TopicCompletion.user_id == user_id,
                TopicCompletion.topic_id == topic_id,
                TopicCompletion.roadmap_id == roadmap_id
            )
        )
        completion = result.scalar_one_or_none()

        if not completion:
            completion = TopicCompletion(
                user_id=user_id,
                topic_id=topic_id,
                roadmap_id=roadmap_id,
                quiz_score=quiz_score,
                project_score=project_score,
                combined_score=0.0,
                attempts_count=1
            )
            self.db.add(completion)
        else:
            if quiz_score is not None:
                completion.quiz_score = quiz_score
            if project_score is not None:
                completion.project_score = project_score
            completion.attempts_count += 1

        # Calculate combined score (weighted: 40% quiz, 60% project)
        # If only quiz done, use quiz score normalized to 0-1
        # If only project done, use project score
        # If both done, use weighted average

        quiz_normalized = (completion.quiz_score / 5.0) if completion.quiz_score is not None else 0
        project_normalized = completion.project_score if completion.project_score is not None else 0

        if completion.quiz_score is not None and completion.project_score is not None:
            completion.combined_score = (quiz_normalized * 0.4) + (project_normalized * 0.6)
        elif completion.quiz_score is not None:
            completion.combined_score = quiz_normalized
        elif completion.project_score is not None:
            completion.combined_score = project_normalized

        # Mark as completed if combined score >= 0.7 (70%)
        if completion.combined_score >= 0.7:
            completion.completed = True
            if not completion.completed_at:
                completion.completed_at = datetime.now()

        await self.db.commit()
    
    async def get_user_quiz_attempts(self, user_id: int, topic_id: int = None, level_id: int = None, quiz_id: int = None) -> List[QuizAttempt]:
        """Get quiz attempts for a user, optionally filtered by topic, level or quiz"""
        stmt = select(QuizAttempt).where(QuizAttempt.user_id == user_id)

        if topic_id:
            stmt = stmt.where(QuizAttempt.topic_id == topic_id)
        if level_id:
            stmt = stmt.where(QuizAttempt.level_id == level_id)
        if quiz_id:
            stmt = stmt.where(QuizAttempt.quiz_id == quiz_id)

        result = await self.db.execute(stmt.order_by(QuizAttempt.attempted_at.desc()))
        return result.scalars().all()
    
    async def get_topic_completion(self, user_id: int, topic_id: int) -> TopicCompletion:
        """Get topic completion status for a user"""
        result = await self.db.execute(
            select(TopicCompletion).where(
                TopicCompletion.user_id == user_id,
                TopicCompletion.topic_id == topic_id
            )
        )
        return result.scalar_one_or_none()
    
    async def get_level_completion(self, user_id: int, level_id: int):
        """Get level completion status for a user"""
        from app.models import LevelCompletion # Import here to avoid circular dependency
        result = await self.db.execute(
            select(LevelCompletion).where(
                LevelCompletion.user_id == user_id,
                LevelCompletion.level_id == level_id
            )
        )
        return result.scalar_one_or_none()
