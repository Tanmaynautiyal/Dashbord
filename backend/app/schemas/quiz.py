from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class DailyQuizQuestionBase(BaseModel):
    question_text: str
    options: List[str]

class DailyQuizQuestionOut(DailyQuizQuestionBase):
    id: UUID
    # Intentionally hiding correct_option_index from the client in the normal output!

    class Config:
        from_attributes = True

class DailyQuizOut(BaseModel):
    id: UUID
    date: datetime
    topic_id: UUID
    topic_title: Optional[str] = None
    difficulty_level: Optional[str] = "Intermediate"
    questions: List[DailyQuizQuestionOut]
    already_completed_perfect: bool = False

    class Config:
        from_attributes = True

class QuizTopicOption(BaseModel):
    key: str
    title: str
    category: str
    icon: str

class QuizDifficultyOption(BaseModel):
    key: str
    label: str
    badgeColor: str
    desc: str

class QuizOptionsOut(BaseModel):
    topics: List[QuizTopicOption]
    difficulties: List[QuizDifficultyOption]

class QuizAnswerSubmit(BaseModel):
    question_id: UUID
    selected_index: int

class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerSubmit]

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    feedback: str
