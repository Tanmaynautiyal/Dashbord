from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, String, Text, Uuid, func, false, true
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AIToolCategory(str, Enum):
    AI_CHATBOT = "AI Chatbot"
    CODING_ASSISTANT = "Coding Assistant"
    IMAGE_GENERATION = "Image Generation"
    VIDEO_GENERATION = "Video Generation"
    DEVELOPER_TOOL = "Developer Tool"
    AI_AGENT = "AI Agent"


class PricingType(str, Enum):
    FREE = "Free"
    FREEMIUM = "Freemium"
    PAID = "Paid"


class AITool(Base):
    __tablename__ = "ai_tools"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    official_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    category: Mapped[AIToolCategory] = mapped_column(
        SqlEnum(
            AIToolCategory,
            name="ai_tool_category",
            values_callable=lambda categories: [category.value for category in categories],
        ),
        nullable=False,
    )
    pricing_type: Mapped[PricingType] = mapped_column(
        SqlEnum(
            PricingType,
            name="pricing_type",
            values_callable=lambda pricing_types: [pricing_type.value for pricing_type in pricing_types],
        ),
        nullable=False,
    )
    logo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=false(),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=true(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
