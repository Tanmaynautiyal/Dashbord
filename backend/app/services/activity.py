from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.models.user import User


def log_activity(
    db: Session,
    user: Optional[User] = None,
    action: str = "",
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user.id if user is not None else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
