from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.models.user import User, UserRole
from app.models.ai_tool import AITool, AIToolCategory, PricingType
from app.services.scraper import (
    build_daily_learning_plan,
    scrape_aixploria_free_ai,
    scrape_futuretools_tools,
    scrape_newly_added_tools,
    scrape_w3schools_languages,
)


router = APIRouter(prefix="/scrape", tags=["Scrape"])


@router.get("/futuretools")
async def get_futuretools(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    tools = await scrape_futuretools_tools(limit=limit)
    return {"items": tools, "total": len(tools)}


@router.get("/futuretools/new")
async def get_new_futuretools(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    tools = await scrape_newly_added_tools(limit=limit)
    return {"items": tools, "total": len(tools)}


@router.get("/aixploria")
async def get_aixploria_tools(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    tools = await scrape_aixploria_free_ai(limit=limit)
    return {"items": tools, "total": len(tools)}


@router.get("/w3schools/languages")
async def get_w3schools_languages(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    languages = await scrape_w3schools_languages(limit=limit)
    return {"items": languages, "total": len(languages)}


@router.get("/learning/daily")
async def get_daily_learning_plan(
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    languages = await scrape_w3schools_languages(limit=10)
    return build_daily_learning_plan(languages)


@router.post("/futuretools/import")
async def import_futuretools(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")

    tools = await scrape_futuretools_tools(limit=limit)
    imported = []
    skipped = []

    for tool_data in tools:
        existing = db.scalar(select(AITool).where(AITool.slug == tool_data["slug"]))
        if existing:
            skipped.append(tool_data["name"])
            continue

        category = AIToolCategory.AI_CHATBOT
        for cat in AIToolCategory:
            if cat.value.lower() in (tool_data.get("category") or "").lower():
                category = cat
                break

        pricing = PricingType.FREE
        pricing_text = (tool_data.get("pricing") or "").lower()
        if "freemium" in pricing_text:
            pricing = PricingType.FREEMIUM
        elif "paid" in pricing_text:
            pricing = PricingType.PAID

        tool = AITool(
            name=tool_data["name"],
            slug=tool_data["slug"],
            description=tool_data.get("description") or f"Imported from FutureTools.io - {tool_data['name']}",
            official_url=tool_data.get("url") or f"https://futuretools.io/tools/{tool_data['slug']}",
            category=category,
            pricing_type=pricing,
            logo_url=tool_data.get("image_url"),
            is_featured=False,
            is_active=True,
        )
        db.add(tool)
        imported.append(tool_data["name"])

    db.commit()
    return {"imported": imported, "skipped": skipped, "total_imported": len(imported)}
