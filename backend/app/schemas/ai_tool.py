from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
import re

from app.models.ai_tool import AIToolCategory, PricingType


def _slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')


class AIToolBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=255)
    description: str = Field(min_length=1)
    official_url: str = Field(min_length=5, max_length=2048)
    category: AIToolCategory
    pricing_type: PricingType
    logo_url: str | None = None
    is_featured: bool = False
    is_active: bool = True

    @field_validator('slug', mode='before')
    @classmethod
    def clean_slug(cls, v: str) -> str:
        return _slugify(v)

    @field_validator('official_url', mode='before')
    @classmethod
    def clean_url(cls, v: str) -> str:
        v = str(v).strip()
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

    @field_validator('logo_url', mode='before')
    @classmethod
    def clean_logo_url(cls, v: str | None) -> str | None:
        if not v:
            return None
        v = str(v).strip()
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v


class AIToolCreate(AIToolBase):
    pass


class AIToolUpdate(BaseModel):
    """All fields optional for partial updates (PATCH)."""
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    official_url: str | None = Field(default=None, min_length=5, max_length=2048)
    category: AIToolCategory | None = None
    pricing_type: PricingType | None = None
    logo_url: str | None = None
    is_featured: bool | None = None
    is_active: bool | None = None

    @field_validator('slug', mode='before')
    @classmethod
    def clean_slug(cls, v: str | None) -> str | None:
        return _slugify(v) if v else v

    @field_validator('official_url', mode='before')
    @classmethod
    def clean_url(cls, v: str | None) -> str | None:
        if not v:
            return v
        v = str(v).strip()
        if v and not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v


class AIToolResponse(AIToolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedAITools(BaseModel):
    items: list[AIToolResponse]
    total: int
    page: int
    page_size: int

    model_config = ConfigDict(from_attributes=True)
