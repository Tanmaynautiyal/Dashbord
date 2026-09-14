from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.tools import router as tools_router
from app.api.dashboard import router as dashboard_router
from app.api.scrape import router as scrape_router
from app.api.chat import router as chat_router
from app.api.quiz import router as quiz_router
from app.api.notifications import router as notifications_router
from app.api.smtp import router as smtp_router
from app.database.seed import ensure_default_admin


app = FastAPI(title="Developer Productivity Dashboard API")


@app.on_event("startup")
def startup_event() -> None:
    ensure_default_admin()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.onrender\.com$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(scrape_router)
app.include_router(admin_router)
app.include_router(tools_router)
app.include_router(chat_router)
app.include_router(quiz_router)
app.include_router(notifications_router)
app.include_router(smtp_router)
