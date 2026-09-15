from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from pydantic import BaseModel

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.models.ai_tool import AITool
import random
from app.models.content import LearningTopic
from app.services.ai import generate_dashboard_insight
from app.services.activity import log_activity
from app.services.learning import (
    get_or_create_daily_learning_content,
    get_daily_recommended_topics,
    get_all_topics,
    calculate_user_streak,
    is_user_beginner_or_new,
)


class RecordActivityRequest(BaseModel):
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/me")
async def get_my_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        total_users = db.scalar(select(func.count()).select_from(User)) or 0
        total_tools = db.scalar(select(func.count()).select_from(AITool)) or 0
        featured_tools_count = db.scalar(select(func.count()).select_from(AITool).where(AITool.is_featured.is_(True))) or 0
        total_topics = db.scalar(select(func.count()).select_from(LearningTopic)) or 0

        user_activity_week = db.scalar(
            select(func.count())
            .select_from(ActivityLog)
            .where(ActivityLog.user_id == current_user.id)
            .where(ActivityLog.created_at >= week_ago)
        ) or 0

        user_activity_month = db.scalar(
            select(func.count())
            .select_from(ActivityLog)
            .where(ActivityLog.user_id == current_user.id)
            .where(ActivityLog.created_at >= month_ago)
        ) or 0

        recent_activity = db.scalars(
            select(ActivityLog)
            .where(ActivityLog.user_id == current_user.id)
            .order_by(ActivityLog.created_at.desc())
            .limit(10)
        ).all()

        # Featured & new AI tools for dashboard display, shuffled uniquely per user
        all_featured = db.scalars(
            select(AITool)
            .where(AITool.is_featured.is_(True))
            .where(AITool.is_active.is_(True))
            .order_by(AITool.created_at.desc())
        ).all()
        user_rng = random.Random(str(current_user.id))
        shuffled_featured = list(all_featured)
        user_rng.shuffle(shuffled_featured)
        featured_tools = shuffled_featured[:6]

        # Calculate real consecutive-day learning streak
        try:
            learning_streak = calculate_user_streak(db, current_user.id)
        except Exception:
            learning_streak = 1

        # Check if user is a beginner / new user
        try:
            is_new = is_user_beginner_or_new(db, current_user)
        except Exception:
            is_new = True

        # Rotating daily recommended topics, personalized and shuffled automatically per user
        try:
            latest_topics = get_daily_recommended_topics(db, user=current_user, limit=5)
        except Exception:
            latest_topics = []

        # Dynamic learning focus (starts with Beginner topic for new users, then advances)
        try:
            today_content = get_or_create_daily_learning_content(db, user=current_user)
        except Exception:
            today_content = None

        try:
            ai_insight = await generate_dashboard_insight(
                user_name=current_user.name,
                activity_count=user_activity_week,
                tools_count=total_tools,
            )
        except Exception:
            ai_insight = "Keep exploring and learning — your dashboard is growing!"

        return {
            "user": {
                "id": str(current_user.id),
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
                "is_active": current_user.is_active,
                "created_at": current_user.created_at.isoformat() if hasattr(current_user.created_at, "isoformat") else str(current_user.created_at),
                "updated_at": current_user.updated_at.isoformat() if hasattr(current_user.updated_at, "isoformat") else str(current_user.updated_at),
            },
            "stats": {
                "total_tools": total_tools,
                "featured_tools": featured_tools_count,
                "total_topics": total_topics,
                "user_activity_week": user_activity_week,
                "user_activity_month": user_activity_month,
                "learning_streak": learning_streak,
            },
            "featured_tools": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "slug": t.slug,
                    "description": t.description,
                    "official_url": t.official_url,
                    "category": t.category.value if hasattr(t.category, "value") else str(t.category),
                    "pricing_type": t.pricing_type.value if hasattr(t.pricing_type, "value") else str(t.pricing_type),
                    "logo_url": t.logo_url,
                    "is_featured": t.is_featured,
                }
                for t in featured_tools
            ],
            "latest_topics": latest_topics,
            "today_content": today_content,
            "recent_activity": [
                {
                    "id": str(a.id),
                    "action": a.action,
                    "resource_type": a.resource_type,
                    "resource_id": a.resource_id,
                    "created_at": a.created_at.isoformat() if hasattr(a.created_at, "isoformat") else str(a.created_at),
                }
                for a in recent_activity
            ],
            "ai_insight": ai_insight,
            "active_users": total_users,
            "is_new_user": is_new,
        }
    except Exception as exc:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Dashboard error: {type(exc).__name__}: {str(exc)}\n{traceback.format_exc()}",
        )


@router.get("/topics/shuffle")
def shuffle_topics(
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    """Returns a new rotating batch of recommended learning topics."""
    return get_daily_recommended_topics(db, user=current_user, shuffle_offset=offset, limit=5)


@router.get("/topics")
def list_all_topics(
    search: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    """Returns all learning topics in the catalog for exploration."""
    return get_all_topics(db, search=search, difficulty=difficulty)


@router.post("/activity")
def record_activity(
    payload: RecordActivityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Records a live developer activity event (e.g. topic studied, quiz completed, ai interaction)."""
    entry = log_activity(
        db,
        user=current_user,
        action=payload.action,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
    )
    return {
        "id": str(entry.id),
        "action": entry.action,
        "resource_type": entry.resource_type,
        "resource_id": entry.resource_id,
        "created_at": entry.created_at.isoformat(),
    }


