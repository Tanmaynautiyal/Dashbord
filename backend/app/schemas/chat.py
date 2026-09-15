from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import List

from app.models.chatbot import SenderType

class ChatMessageBase(BaseModel):
    content: str

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageOut(ChatMessageBase):
    id: UUID
    user_id: UUID | None = None
    sender: SenderType
    created_at: datetime

    class Config:
        from_attributes = True
