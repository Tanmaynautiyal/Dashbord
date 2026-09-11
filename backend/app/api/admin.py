from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.dependencies.roles import require_roles
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.models.ai_tool import AITool
from app.models.activity_log import ActivityLog
from app.models.content import Technology, Category, LearningTopic, DailyLearningContent
from app.schemas.ai_tool import AIToolCreate, AIToolUpdate, AIToolResponse
from app.schemas.content import (
    TechnologyCreate, TechnologyUpdate, TechnologyResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    LearningTopicCreate, LearningTopicUpdate, LearningTopicResponse,
    DailyLearningContentCreate, DailyLearningContentUpdate, DailyLearningContentResponse
)
from app.core.security import hash_password
from pydantic import BaseModel, EmailStr, Field


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/test")
def admin_test(current_user: User = Depends(require_roles(UserRole.ADMIN))) -> dict[str, str]:
    return {"message": "Admin access granted."}


@router.get("/stats")
def admin_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_users = db.scalar(select(func.count()).select_from(User).where(User.is_active.is_(True))) or 0
    new_users_week = db.scalar(
        select(func.count()).select_from(User).where(User.created_at >= week_ago)
    ) or 0
    total_tools = db.scalar(select(func.count()).select_from(AITool)) or 0
    total_activity = db.scalar(select(func.count()).select_from(ActivityLog)) or 0
    
    total_technologies = db.scalar(select(func.count()).select_from(Technology)) or 0
    total_categories = db.scalar(select(func.count()).select_from(Category)) or 0
    total_topics = db.scalar(select(func.count()).select_from(LearningTopic)) or 0

    recent_activity = db.scalars(
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    ).all()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "new_users_week": new_users_week,
        "total_tools": total_tools,
        "total_activity": total_activity,
        "total_technologies": total_technologies,
        "total_categories": total_categories,
        "total_topics": total_topics,
        "recent_activity": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id,
                "created_at": a.created_at,
            }
            for a in recent_activity
        ],
    }


@router.get("/users")
def admin_list_users(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "updated_at": u.updated_at,
            }
            for u in users
        ],
        "total": len(users),
    }


@router.get("/activities")
def admin_list_activities(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
) -> dict:
    activities = db.scalars(
        select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    ).all()

    user_ids = {a.user_id for a in activities if a.user_id}
    users = db.scalars(select(User).where(User.id.in_(user_ids))).all() if user_ids else []
    user_map = {u.id: u.name for u in users}

    return {
        "activities": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "user_name": user_map.get(a.user_id) if a.user_id else None,
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id,
                "created_at": a.created_at,
            }
            for a in activities
        ],
        "total": len(activities),
    }


@router.post("/tools", response_model=AIToolResponse, status_code=status.HTTP_201_CREATED)
def create_tool(
    tool_in: AIToolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> AITool:
    existing = db.scalar(select(AITool).where(AITool.slug == tool_in.slug))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A tool with this slug already exists.")

    tool = AITool(
        name=tool_in.name,
        slug=tool_in.slug,
        description=tool_in.description,
        official_url=tool_in.official_url,
        category=tool_in.category,
        pricing_type=tool_in.pricing_type,
        logo_url=tool_in.logo_url,
        is_featured=tool_in.is_featured,
        is_active=tool_in.is_active,
    )
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.put("/tools/{id}", response_model=AIToolResponse)
def update_tool(
    id: UUID = Path(...),
    tool_in: AIToolUpdate = ...,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> AITool:
    tool = db.get(AITool, id)
    if tool is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")

    update_data = tool_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tool, field, value)

    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


@router.delete("/tools/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tool(
    id: UUID = Path(...), db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> None:
    tool = db.get(AITool, id)
    if tool is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool not found")
    db.delete(tool)
    db.commit()
    return None

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserStatusUpdate(BaseModel):
    is_active: bool

class AdminUserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.USER
    is_active: bool = True

class AdminUserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=6)

@router.post("/users", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    user_in: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> dict:
    existing = db.scalar(select(User).where(User.email == user_in.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists.")
    
    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        is_active=user_in.is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role.value,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at,
        "updated_at": new_user.updated_at,
    }

@router.put("/users/{id}")
def admin_update_user(
    id: UUID,
    user_in: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> dict:
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_in.name is not None:
        user.name = user_in.name.strip()
    if user_in.email is not None:
        new_email = user_in.email.lower().strip()
        if new_email != user.email:
            existing = db.scalar(select(User).where(User.email == new_email))
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use by another user.")
            user.email = new_email
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        if user.id == current_user.id and not user_in.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own admin account")
        user.is_active = user_in.is_active
    if user_in.password:
        user.password_hash = hash_password(user_in.password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }

@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> None:
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")
    db.delete(user)
    db.commit()
    return None

@router.put("/users/{id}/role")
def update_user_role(
    id: UUID, role_update: UserRoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> dict:
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role_update.role
    db.commit()
    return {"message": "Role updated", "role": user.role.value}

@router.put("/users/{id}/status")
def update_user_status(
    id: UUID, status_update: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))
) -> dict:
    user = db.get(User, id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own status")
    user.is_active = status_update.is_active
    db.commit()
    return {"message": "Status updated", "is_active": user.is_active}

# Content CRUD Endpoints

@router.get("/technologies", response_model=list[TechnologyResponse])
def list_technologies(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return db.scalars(select(Technology).order_by(Technology.name)).all()

@router.post("/technologies", response_model=TechnologyResponse, status_code=status.HTTP_201_CREATED)
def create_technology(tech: TechnologyCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    db_tech = Technology(**tech.model_dump())
    db.add(db_tech)
    db.commit()
    db.refresh(db_tech)
    return db_tech

@router.put("/technologies/{id}", response_model=TechnologyResponse)
def update_technology(
    id: UUID,
    tech_in: TechnologyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    tech = db.get(Technology, id)
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technology not found")
    for field, val in tech_in.model_dump(exclude_unset=True).items():
        setattr(tech, field, val)
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return tech

@router.delete("/technologies/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    tech = db.get(Technology, id)
    if tech:
        db.delete(tech)
        db.commit()
    return None

@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return db.scalars(select(Category).order_by(Category.name)).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(cat: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    db_cat = Category(**cat.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.put("/categories/{id}", response_model=CategoryResponse)
def update_category(
    id: UUID,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    cat = db.get(Category, id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for field, val in cat_in.model_dump(exclude_unset=True).items():
        setattr(cat, field, val)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    cat = db.get(Category, id)
    if cat:
        db.delete(cat)
        db.commit()
    return None

@router.get("/learning-topics", response_model=list[LearningTopicResponse])
def list_learning_topics(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return db.scalars(select(LearningTopic).order_by(LearningTopic.title)).all()

@router.post("/learning-topics", response_model=LearningTopicResponse, status_code=status.HTTP_201_CREATED)
def create_learning_topic(topic: LearningTopicCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    db_topic = LearningTopic(**topic.model_dump())
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@router.put("/learning-topics/{id}", response_model=LearningTopicResponse)
def update_learning_topic(
    id: UUID,
    topic_in: LearningTopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    topic = db.get(LearningTopic, id)
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning topic not found")
    for field, val in topic_in.model_dump(exclude_unset=True).items():
        setattr(topic, field, val)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.delete("/learning-topics/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_topic(id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    topic = db.get(LearningTopic, id)
    if topic:
        db.delete(topic)
        db.commit()
    return None

@router.get("/daily-learning", response_model=list[DailyLearningContentResponse])
def list_daily_learning(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return db.scalars(select(DailyLearningContent).order_by(DailyLearningContent.publish_date.desc())).all()

@router.post("/daily-learning", response_model=DailyLearningContentResponse, status_code=status.HTTP_201_CREATED)
def create_daily_learning(content: DailyLearningContentCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    db_content = DailyLearningContent(**content.model_dump())
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.put("/daily-learning/{id}", response_model=DailyLearningContentResponse)
def update_daily_learning(
    id: UUID,
    content_in: DailyLearningContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    content = db.get(DailyLearningContent, id)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily learning content not found")
    for field, val in content_in.model_dump(exclude_unset=True).items():
        setattr(content, field, val)
    db.add(content)
    db.commit()
    db.refresh(content)
    return content

@router.delete("/daily-learning/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_daily_learning(id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    content = db.get(DailyLearningContent, id)
    if content:
        db.delete(content)
        db.commit()
    return None


