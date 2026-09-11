import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database.seed import ensure_default_admin
from app.database.session import SessionLocal
from app.models.user import User


def test_ensure_default_admin_creates_admin_account():
    db = SessionLocal()
    try:
        db.query(User).filter(User.email == 'admin@dev.prod').delete()
        db.commit()

        ensure_default_admin()

        admin = db.query(User).filter(User.email == 'admin@dev.prod').one()
        assert admin.role.value == 'admin'
        assert admin.is_active is True
        assert admin.name == 'System Admin'
    finally:
        db.close()
