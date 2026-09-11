from datetime import datetime, timezone, date as date_type
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from sqlalchemy import func, cast, Date

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.quiz import DailyQuiz, DailyQuizQuestion, DailyQuizAnswer
from app.models.content import LearningTopic
from app.models.user import User
from app.schemas.quiz import DailyQuizOut, QuizSubmitRequest, QuizSubmitResponse, QuizOptionsOut
from app.services.activity import log_activity
from app.services.quiz_service import (
    get_or_create_custom_quiz,
    get_shuffled_quiz_questions,
    get_quiz_metadata,
)
from app.services.learning import is_user_beginner_or_new

router = APIRouter(prefix="/quiz", tags=["quiz"])


def check_perfect_today(db: Session, user_id: UUID, quiz_id: UUID) -> bool:
    """Check if the user already scored 10/10 for this quiz today."""
    today = datetime.now(timezone.utc).date()
    result = db.execute(
        select(DailyQuizAnswer).where(
            DailyQuizAnswer.user_id == user_id,
            DailyQuizAnswer.quiz_id == quiz_id,
            DailyQuizAnswer.score == 10,
        )
    )
    return result.scalar_one_or_none() is not None


@router.get("/options", response_model=QuizOptionsOut)
def get_quiz_options():
    """Returns available topics and difficulty levels for user choice."""
    return get_quiz_metadata()


@router.get("/today", response_model=DailyQuizOut)
def get_today_quiz(
    topic_key: Optional[str] = "daily",
    difficulty: Optional[str] = None,
    shuffle_seed: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Automatically adapt starting difficulty: new users start on Beginner!
    if not difficulty:
        if is_user_beginner_or_new(db, current_user):
            difficulty = "Beginner"
        else:
            difficulty = "Intermediate"

    # Retrieve or generate quiz based on user choice of topic and difficulty
    quiz, topic_title, difficulty_level = get_or_create_custom_quiz(
        db=db,
        topic_key=topic_key,
        difficulty=difficulty,
    )

    # Check if user already scored perfect today → signal frontend to hide questions
    already_perfect = check_perfect_today(db, current_user.id, quiz.id)

    # Fetch questions for this quiz
    q_result = db.execute(
        select(DailyQuizQuestion).where(DailyQuizQuestion.quiz_id == quiz.id)
    )
    questions = q_result.scalars().all()

    # Shuffle questions per user and/or requested shuffle_seed
    shuffled_questions = get_shuffled_quiz_questions(
        questions=list(questions),
        user_id=current_user.id,
        shuffle_seed=shuffle_seed,
    )

    return {
        "id": quiz.id,
        "date": quiz.date,
        "topic_id": quiz.topic_id,
        "topic_title": topic_title,
        "difficulty_level": difficulty_level,
        "questions": [] if already_perfect else shuffled_questions,
        "already_completed_perfect": already_perfect,
    }


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")

    score = 0
    total = len(payload.answers)
    quiz_id = None

    for ans in payload.answers:
        q_result = db.execute(
            select(DailyQuizQuestion).where(DailyQuizQuestion.id == ans.question_id)
        )
        question = q_result.scalar_one_or_none()
        if question:
            quiz_id = question.quiz_id
            if question.correct_option_index == ans.selected_index:
                score += 1

    if not quiz_id:
        raise HTTPException(status_code=400, detail="Invalid questions submitted")

    # Scale to 10 points
    final_score = int((score / total) * 10) if total > 0 else 0

    # Save the attempt
    db.add(DailyQuizAnswer(quiz_id=quiz_id, user_id=current_user.id, score=final_score))
    db.commit()

    # Fetch topic name & difficulty for live activity feed
    topic_label = "Quiz"
    quiz_obj = db.get(DailyQuiz, quiz_id)
    if quiz_obj and quiz_obj.topic_id:
        topic_obj = db.get(LearningTopic, quiz_obj.topic_id)
        if topic_obj and topic_obj.title:
            topic_label = topic_obj.title

    try:
        log_activity(
            db,
            user=current_user,
            action="quiz_completed",
            resource_type="daily_quiz",
            resource_id=f"{topic_label} — {final_score}/10",
        )
    except Exception:
        pass

    if final_score == 10:
        feedback = "🎉 Well done! You aced it! See you tomorrow!"
    elif final_score >= 7:
        feedback = f"Good job! You scored {final_score}/10. Try again to get a perfect score!"
    else:
        feedback = f"You scored {final_score}/10. Keep practicing — try again!"

    return {
        "score": final_score,
        "total": 10,
        "feedback": feedback,
    }

