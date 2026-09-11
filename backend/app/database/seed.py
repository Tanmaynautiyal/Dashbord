from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole
import app.models  # noqa: F401 Ensure all models are registered

DEFAULT_ADMIN_EMAIL = "admin@mail.com"
DEFAULT_ADMIN_PASSWORD = "Mind@123"
DEFAULT_ADMIN_NAME = "Admin"


def ensure_default_admin() -> dict[str, bool | str]:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))

        if admin is None:
            admin = User(
                name=DEFAULT_ADMIN_NAME,
                email=DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            return {"created": True, "email": admin.email}

        needs_update = False
        if admin.role != UserRole.ADMIN:
            admin.role = UserRole.ADMIN
            needs_update = True
        if admin.name != DEFAULT_ADMIN_NAME:
            admin.name = DEFAULT_ADMIN_NAME
            needs_update = True
        if not admin.is_active:
            admin.is_active = True
            needs_update = True
        if admin.password_hash == "" or admin.password_hash is None:
            admin.password_hash = hash_password(DEFAULT_ADMIN_PASSWORD)
            needs_update = True
        if needs_update:
            db.commit()

        return {"created": False, "email": admin.email}
    finally:
        db.close()
