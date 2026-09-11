from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Integer, Uuid, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DailyQuiz(Base):
    __tablename__ = "daily_quizzes"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    topic_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("learning_topics.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    questions: Mapped[list["DailyQuizQuestion"]] = relationship("DailyQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class DailyQuizQuestion(Base):
    __tablename__ = "daily_quiz_questions"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("daily_quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(String(1024), nullable=False)
    options: Mapped[list] = mapped_column(JSON, nullable=False)  # list of strings
    correct_option_index: Mapped[int] = mapped_column(Integer, nullable=False)

    quiz: Mapped["DailyQuiz"] = relationship("DailyQuiz", back_populates="questions")


class DailyQuizAnswer(Base):
    __tablename__ = "daily_quiz_answers"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("daily_quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False) # score out of 10
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
