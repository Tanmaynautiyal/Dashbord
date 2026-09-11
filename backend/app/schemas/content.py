from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TechnologyBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str
    official_url: str | None = None
    icon_url: str | None = None
    is_active: bool = True

    @field_validator('official_url', 'icon_url', mode='before')
    @classmethod
    def clean_url(cls, v: str | None) -> str | None:
        if not v:
            return None
        v = str(v).strip()
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v


class TechnologyCreate(TechnologyBase):
    pass


class TechnologyUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    official_url: str | None = None
    icon_url: str | None = None
    is_active: bool | None = None

    @field_validator('official_url', 'icon_url', mode='before')
    @classmethod
    def clean_url(cls, v: str | None) -> str | None:
        if not v:
            return None
        v = str(v).strip()
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v


class TechnologyResponse(TechnologyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    description: str | None = None


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LearningTopicBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    difficulty_level: str = Field(default="Beginner", max_length=50)


class LearningTopicCreate(LearningTopicBase):
    pass


class LearningTopicUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = None
    difficulty_level: str | None = Field(default=None, max_length=50)


class LearningTopicResponse(LearningTopicBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DailyLearningContentBase(BaseModel):
    topic_id: UUID
    content_text: str
    publish_date: datetime


class DailyLearningContentCreate(DailyLearningContentBase):
    pass


class DailyLearningContentUpdate(BaseModel):
    topic_id: UUID | None = None
    content_text: str | None = None
    publish_date: datetime | None = None


class DailyLearningContentResponse(DailyLearningContentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
