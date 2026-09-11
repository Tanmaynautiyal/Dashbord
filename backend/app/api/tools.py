from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.ai_tool import AITool, AIToolCategory
from app.schemas.ai_tool import AIToolResponse, PaginatedAITools
from app.dependencies.auth import get_optional_current_user
from app.models.user import User
from app.services.activity import log_activity


router = APIRouter(prefix="/tools", tags=["AI Tools"])


@router.get("", response_model=PaginatedAITools)
def list_tools(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name or description"),
    category: Optional[AIToolCategory] = Query(None),
    db: Session = Depends(get_db),
) -> dict:
    stmt = select(AITool)

    filters = []
    if search:
        like = f"%{search}%"
        filters.append(or_(AITool.name.ilike(like), AITool.description.ilike(like)))
    if category:
        filters.append(AITool.category == category)

    if filters:
        for f in filters:
            stmt = stmt.where(f)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = db.execute(stmt).scalars().all()

    return {
        "items": items,
        "total": total or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{slug}", response_model=AIToolResponse)
def get_tool(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> AITool:
    tool = db.scalar(select(AITool).where(AITool.slug == slug))
    if tool is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")

    # Log tool view only when a user is authenticated
    if current_user is not None:
        try:
            log_activity(db, user=current_user, action="tool_viewed", resource_type="ai_tool", resource_id=str(tool.id))
        except Exception:
            pass

    return tool
