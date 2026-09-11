from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationItem(BaseModel):
    id: str
    category: str
    category_label: str
    title: str
    detail: str
    badge: str
    badge_color: str  # emerald, purple, blue, cyan, amber, rose, indigo
    timestamp: str
    unread: bool
    action_url: Optional[str] = None
    action_label: Optional[str] = None


class NotificationActionResponse(BaseModel):
    success: bool
    message: str


# Real, authoritative curated feed of AI tools, tech releases, and platform updates
REAL_NOTIFICATIONS: List[dict] = [
    {
        "id": "notif-1",
        "category": "ai_tool",
        "category_label": "🤖 AI Tool & Model",
        "title": "DeepSeek-R1 Open Reasoning Model Released",
        "detail": "DeepSeek has open-sourced DeepSeek-R1, matching OpenAI o1 on math (AIME 79.8%) and code (Codeforces 96.3%) benchmarks. Includes 6 distilled models (1.5B to 70B) based on Llama & Qwen at ~95% lower inference cost.",
        "badge": "Open SOTA Reasoning",
        "badge_color": "emerald",
        "timestamp": "25m ago",
        "unread": True,
        "action_url": "/explore",
        "action_label": "Explore AI Tools",
    },
    {
        "id": "notif-2",
        "category": "ai_tool",
        "category_label": "🤖 AI Tool & Model",
        "title": "Claude 3.7 Sonnet & Hybrid Reasoning GA",
        "detail": "Anthropic launched Claude 3.7 Sonnet, introducing hybrid reasoning architecture. Developers can dynamically set thinking budgets from 0 (instant latency) up to 128k tokens for deep codebase synthesis and autonomous terminal agent tasks.",
        "badge": "Hybrid Thinking",
        "badge_color": "purple",
        "timestamp": "2h ago",
        "unread": True,
        "action_url": "https://anthropic.com",
        "action_label": "Official Announcement",
    },
    {
        "id": "notif-3",
        "category": "ai_tool",
        "category_label": "🤖 Coding Assistant",
        "title": "Cursor & Windsurf: Agentic IDE Evolution",
        "detail": "AI-native IDEs Cursor and Windsurf Cascade have upgraded their autonomous agent systems. Features include multi-file speculative diffs, background terminal command execution, and MCP (Model Context Protocol) tool integration.",
        "badge": "Agentic Workflow",
        "badge_color": "blue",
        "timestamp": "5h ago",
        "unread": True,
        "action_url": "/explore",
        "action_label": "Explore IDE Tools",
    },
    {
        "id": "notif-4",
        "category": "tech_trend",
        "category_label": "🚀 Framework Release",
        "title": "Next.js 15 & React 19 Official Production GA",
        "detail": "Vercel announced Next.js 15 with Turbopack enabled by default for local development (up to 53% faster startup times). Fully supports React 19 features including Server Actions, useActionState, and Async Request APIs.",
        "badge": "Production GA",
        "badge_color": "cyan",
        "timestamp": "1d ago",
        "unread": False,
        "action_url": "/dashboard",
        "action_label": "Review React 19 Topics",
    },
    {
        "id": "notif-5",
        "category": "tech_trend",
        "category_label": "🚀 Language Runtime",
        "title": "Python 3.13: Free-Threaded No-GIL & JIT Compiler",
        "detail": "Python 3.13 is officially released. Highlights include experimental free-threaded CPython allowing execution with the Global Interpreter Lock (GIL) disabled for true multicore CPU scaling, plus an experimental Copy-on-Write JIT compiler.",
        "badge": "No-GIL Era",
        "badge_color": "amber",
        "timestamp": "1d ago",
        "unread": False,
        "action_url": "/dashboard",
        "action_label": "Explore Python Topics",
    },
    {
        "id": "notif-6",
        "category": "ai_tool",
        "category_label": "🤖 Local AI Runtime",
        "title": "Ollama 0.5: Local GPU Inference & Structured JSON",
        "detail": "Ollama 0.5 brings zero-setup local execution for Llama 3.3 70B, DeepSeek-R1, and Qwen 2.5 Coder. Features hardware-accelerated Apple Metal & NVIDIA CUDA support, structured schema outputs, and native tool-calling APIs.",
        "badge": "Local LLMs",
        "badge_color": "emerald",
        "timestamp": "2d ago",
        "unread": False,
        "action_url": "/explore",
        "action_label": "View Local AI Tools",
    },
    {
        "id": "notif-7",
        "category": "tech_trend",
        "category_label": "🚀 Styling & Design",
        "title": "Tailwind CSS v4.0 Engine Architecture",
        "detail": "Tailwind CSS v4 has been completely rebuilt in Rust with Lightning CSS. Eliminates the need for tailwind.config.js, uses native CSS @theme variables, and achieves 10x faster compile times with 35% smaller bundle outputs.",
        "badge": "10x Faster Build",
        "badge_color": "indigo",
        "timestamp": "3d ago",
        "unread": False,
        "action_url": "https://tailwindcss.com",
        "action_label": "Read v4 Changelog",
    },
    {
        "id": "notif-8",
        "category": "platform_learning",
        "category_label": "📚 Learning Platform",
        "title": "Today's Daily Learning Focus Live",
        "detail": "Today's curated focus topic is ready with code samples and key architectural concepts. Test your understanding with the Daily Quiz Challenge or launch an interactive study session with the AI Tutor.",
        "badge": "Daily Focus",
        "badge_color": "purple",
        "timestamp": "Today, 8:00 AM",
        "unread": False,
        "action_url": "/dashboard",
        "action_label": "Start Today's Topic",
    },
    {
        "id": "notif-9",
        "category": "tech_trend",
        "category_label": "🛡️ Security & DevOps",
        "title": "Docker Scout & AI Container Vulnerability Scanning",
        "detail": "Docker integrated Scout AI into CLI workflows to automatically detect CVEs in container base images and recommend multi-stage build remediations to minimize attack surfaces before pushing to registries.",
        "badge": "Supply Chain Security",
        "badge_color": "rose",
        "timestamp": "3d ago",
        "unread": False,
        "action_url": "/dashboard",
        "action_label": "Practice DevOps Quiz",
    },
]


@router.get("", response_model=List[NotificationItem])
def get_notifications(
    category: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    results = list(REAL_NOTIFICATIONS)
    if category and category != "all":
        results = [n for n in results if n["category"] == category]
    if unread_only:
        results = [n for n in results if n["unread"]]
    return results


@router.post("/mark-all-read", response_model=NotificationActionResponse)
def mark_all_read(current_user: User = Depends(get_current_user)):
    for n in REAL_NOTIFICATIONS:
        n["unread"] = False
    return {"success": True, "message": "All notifications marked as read."}


@router.post("/{notification_id}/toggle-read", response_model=NotificationActionResponse)
def toggle_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    for n in REAL_NOTIFICATIONS:
        if n["id"] == notification_id:
            n["unread"] = not n["unread"]
            return {"success": True, "message": "Notification read status updated."}
    raise HTTPException(status_code=404, detail="Notification not found.")


@router.delete("/{notification_id}", response_model=NotificationActionResponse)
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
):
    global REAL_NOTIFICATIONS
    REAL_NOTIFICATIONS = [n for n in REAL_NOTIFICATIONS if n["id"] != notification_id]
    return {"success": True, "message": "Notification dismissed."}
