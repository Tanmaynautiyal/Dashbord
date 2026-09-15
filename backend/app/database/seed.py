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

DEFAULT_USER_EMAIL = "user@mail.com"
DEFAULT_USER_PASSWORD = "Mind@123"
DEFAULT_USER_NAME = "Demo User"


def ensure_default_admin() -> dict[str, bool | str]:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Ensure Admin Account
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
        else:
            admin.role = UserRole.ADMIN
            admin.name = DEFAULT_ADMIN_NAME
            admin.is_active = True
            admin.password_hash = hash_password(DEFAULT_ADMIN_PASSWORD)

        # 2. Ensure Demo User Account
        demo_user = db.scalar(select(User).where(User.email == DEFAULT_USER_EMAIL))
        if demo_user is None:
            demo_user = User(
                name=DEFAULT_USER_NAME,
                email=DEFAULT_USER_EMAIL,
                password_hash=hash_password(DEFAULT_USER_PASSWORD),
                role=UserRole.USER,
                is_active=True,
            )
            db.add(demo_user)
        else:
            demo_user.role = UserRole.USER
            demo_user.is_active = True
            demo_user.password_hash = hash_password(DEFAULT_USER_PASSWORD)

        # 3. Also ensure Tanmay's personal account exists with Mind@123 password
        tanmay_user = db.scalar(select(User).where(User.email == "tanmaynautiyalnextstark@gmail.com"))
        if tanmay_user is None:
            tanmay_user = User(
                name="Tanmay Nautiyal",
                email="tanmaynautiyalnextstark@gmail.com",
                password_hash=hash_password("Mind@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(tanmay_user)
        else:
            tanmay_user.is_active = True
            tanmay_user.role = UserRole.ADMIN
            tanmay_user.password_hash = hash_password("Mind@123")

        db.commit()
        return {"created": True, "admin": DEFAULT_ADMIN_EMAIL, "user": DEFAULT_USER_EMAIL}
    finally:
        db.close()

