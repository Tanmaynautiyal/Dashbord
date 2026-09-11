import json
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings


settings = get_settings()
AI_API_KEY = settings.ai_api_key.get_secret_value()
AI_API_BASE_URL = settings.ai_api_base_url.rstrip("/")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def _call_ai_chat(messages: list[dict[str, str]], model: str = "gpt-3.5-turbo") -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{AI_API_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": model, "messages": messages, "max_tokens": 256, "temperature": 0.7},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def generate_dashboard_insight(user_name: str, activity_count: int, tools_count: int) -> str:
    if not AI_API_KEY:
        return "AI insights are not configured."

    prompt = (
        f"Generate a short, motivational insight (1-2 sentences) for {user_name} based on their activity. "
        f"They have {activity_count} actions this week and there are {tools_count} AI tools in the catalog. "
        f"Keep it friendly and developer-focused."
    )
    try:
        return await _call_ai_chat([
            {"role": "system", "content": "You are a helpful developer productivity assistant."},
            {"role": "user", "content": prompt},
        ])
    except Exception:
        return "Keep exploring and learning — your dashboard is growing!"
