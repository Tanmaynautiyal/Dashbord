import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Ensure database default to /tmp/dashboard.db on serverless if not set
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/dashboard.db"

from app.main import app
from app.database.seed import ensure_default_admin

try:
    ensure_default_admin()
except Exception as e:
    print("Database init:", e)

