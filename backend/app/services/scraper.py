import re
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.core.config import get_settings

settings = get_settings()
USER_AGENT = "Mozilla/5.0 (compatible; DevProductivityBot/1.0)"


async def _fetch_page(url: str) -> str:
    async with httpx.AsyncClient(timeout=30, headers={"User-Agent": USER_AGENT}) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.text


def _clean_text(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _build_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "tool"


def _extract_tools_from_html(html: str, base_url: str = "https://futuretools.io") -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    tools: list[dict[str, Any]] = []

    seen_slugs: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        match = re.search(r"^/tools/([^?#]+)", href)
        if not match:
            continue
        slug = match.group(1)
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)

        name = _clean_text(a.get_text())
        if not name or len(name) < 2:
            continue
        if name.lower().startswith("view") and len(name) > 4:
            name = name[4:].strip()
        if not name:
            continue

        card = a.find_parent(["div", "article", "li", "section"])
        description = ""
        category = ""
        pricing = ""
        image_url = ""

        if card:
            for p in card.find_all(["p", "div"]):
                text = _clean_text(p.get_text())
                if text and len(text) > 20 and text != name and "View" not in text:
                    description = text[:500]
                    break

            for span in card.find_all(["span", "div", "a", "p"]):
                text = _clean_text(span.get_text())
                if not text:
                    continue
                if text in {"Free", "Freemium", "Paid", "Open Source"}:
                    pricing = text
                elif any(k in text for k in ["AI", "Productivity", "Generative", "Coding", "Agent", "Video", "Image", "Audio"]):
                    if 5 < len(text) < 60:
                        category = text

            img = card.find("img")
            if img:
                src = img.get("src") or img.get("data-src") or ""
                if src:
                    if src.startswith("//"):
                        image_url = "https:" + src
                    elif src.startswith("/"):
                        image_url = base_url + src
                    else:
                        image_url = src

        tool_url = base_url + href if href.startswith("/") else href
        tools.append({
            "name": name,
            "slug": slug,
            "url": tool_url,
            "description": description,
            "category": category,
            "pricing": pricing,
            "image_url": image_url or None,
        })

    return tools


async def scrape_futuretools_tools(limit: int = 50) -> list[dict[str, Any]]:
    html = await _fetch_page("https://futuretools.io/tools")
    tools = _extract_tools_from_html(html)
    return tools[:limit]


async def scrape_newly_added_tools(limit: int = 20) -> list[dict[str, Any]]:
    html = await _fetch_page("https://futuretools.io/newly-added")
    tools = _extract_tools_from_html(html)
    return tools[:limit]


async def scrape_aixploria_free_ai(limit: int = 50) -> list[dict[str, Any]]:
    html = await _fetch_page("https://www.aixploria.com/en/free-ai/")
    soup = BeautifulSoup(html, "lxml")
    tools: list[dict[str, Any]] = []
    seen: set[str] = set()
    excluded = {
        "full list",
        "ai categories",
        "ai tutorials",
        "new ai tools",
        "free ai tools",
        "ai news today",
        "ai deals",
        "bonus & extras",
        "submit an ai",
        "verified",
        "free ai",
        "aixploria",
        "home",
        "view preferences",
        "english",
        "français",
        "español",
        "deutsch",
        "italiano",
        "português",
        "sign up",
        "freemium",
        "paid",
        "visit",
        "+1",
    }
    excluded_prefixes = (
        "free-ai",
        "last-ai",
        "ultimate-list-ai",
        "categories-ai",
        "tutorials",
        "ai-news",
        "bonus-extras",
        "add-ai",
        "ai-deals",
        "verified-ai-tools",
        "newsletter",
        "ai-freemium",
        "ai-paid",
        "category/",
    )

    for a in soup.select("a[href]"):
        href = a.get("href", "")
        text = _clean_text(a.get_text())
        if not href or not text:
            continue
        text_lower = text.lower()
        if text_lower.startswith("#") or text_lower.startswith("+ "):
            continue
        if text_lower in excluded:
            continue
        if "/out/" in href:
            continue
        if not href.startswith("https://www.aixploria.com") and not href.startswith("/en/"):
            continue
        if "/en/" not in href and not href.startswith("/en/"):
            continue
        if href.startswith("https://www.aixploria.com/en/"):
            href_path = href.replace("https://www.aixploria.com", "")
        elif href.startswith("/en/"):
            href_path = href
        else:
            continue
        href_path_lower = href_path.lower()
        if any(href_path_lower.startswith(f"/en/{prefix}") or f"/{prefix}" in href_path_lower for prefix in excluded_prefixes):
            continue
        if "/category/" in href_path_lower:
            continue
        if text_lower in {"visit", "+1"}:
            continue
        if not any(token in text_lower for token in ["ai", "tool", "creator", "studio", "bot", "writer", "design", "labs", "gpt", "copilot", "assistant", "draw", "image", "voice", "code", "model", "video"]):
            if "ai" not in href.lower() and "tool" not in href.lower():
                continue
        full_url = href if href.startswith("http") else "https://www.aixploria.com" + href if href.startswith("/") else href
        slug = _build_slug(text)
        if slug in seen:
            continue
        seen.add(slug)
        tools.append({
            "name": text,
            "slug": slug,
            "url": full_url,
            "description": f"Live AI product entry from Aixploria: {text}.",
            "category": "AI Tool",
            "pricing": "Free",
            "image_url": None,
        })

    return tools[:limit]


async def scrape_w3schools_languages(limit: int = 50) -> list[dict[str, Any]]:
    html = await _fetch_page("https://www.w3schools.com/")
    soup = BeautifulSoup(html, "lxml")
    languages: list[dict[str, Any]] = []
    seen: set[str] = set()
    mapping = {
        "html": "HTML",
        "css": "CSS",
        "js": "JavaScript",
        "javascript": "JavaScript",
        "sql": "SQL",
        "python": "Python",
        "java": "Java",
        "php": "PHP",
        "c": "C",
        "cpp": "C++",
        "cplusplus": "C++",
        "cs": "C#",
        "csharp": "C#",
        "r": "R",
        "nodejs": "Node.js",
        "node": "Node.js",
        "bootstrap": "Bootstrap",
        "jquery": "jQuery",
        "xml": "XML",
        "w3css": "W3.CSS",
        "react": "React",
        "typescript": "TypeScript",
    }
    excluded = {
        "tutorials",
        "references",
        "exercises",
        "certificates",
        "see more",
        "menu",
        "my w3schools",
        "login",
        "sign in",
        "logout",
        "plus",
        "spaces",
        "practice",
        "academy",
        "new w3schools app ios & android start the adventure",
        "w3schools app ios & android new",
        "get certified",
        "try it yourself",
    }

    for a in soup.select("a[href]"):
        href = a.get("href", "")
        text = _clean_text(a.get_text())
        if not href or not text:
            continue
        text_lower = text.lower()
        if text_lower in excluded:
            continue
        href_lower = href.lower()
        full_url = href if href.startswith("http") else "https://www.w3schools.com" + href if href.startswith("/") else href
        if not href_lower.startswith("http") and not href_lower.startswith("/"):
            continue
        key = None
        normalized_text = re.sub(r"[^a-z0-9]+", " ", text_lower).strip()
        for candidate, label in mapping.items():
            if candidate in href_lower or text_lower == candidate or text_lower == label.lower() or normalized_text == candidate or normalized_text == label.lower().replace(" ", ""):
                key = label
                break
        if not key:
            continue
        if key in seen:
            continue
        seen.add(key)
        languages.append({
            "name": key,
            "slug": _build_slug(key),
            "url": full_url,
            "description": f"Learn {key} fundamentals, syntax, and practical examples from W3Schools.",
            "category": "Programming Language",
            "pricing": "Free",
            "image_url": None,
        })

    fallback = ["HTML", "CSS", "JavaScript", "Python", "SQL", "Java", "PHP", "C++", "C#", "React", "TypeScript", "Node.js"]
    for label in fallback:
        if label not in seen:
            languages.append({
                "name": label,
                "slug": _build_slug(label),
                "url": "https://www.w3schools.com/",
                "description": f"Start learning {label} from W3Schools with practical examples and exercises.",
                "category": "Programming Language",
                "pricing": "Free",
                "image_url": None,
            })
            seen.add(label)

    return languages[:limit]


def build_daily_learning_plan(languages: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    items = languages or [
        {"name": "JavaScript"},
        {"name": "Python"},
        {"name": "SQL"},
        {"name": "CSS"},
        {"name": "HTML"},
    ]
    valid_items = [item for item in items if isinstance(item, dict) and item.get("name")]
    priority = ["JavaScript", "Python", "HTML", "CSS", "SQL", "Java", "TypeScript", "PHP", "C++", "C#", "React", "Node.js"]
    preferred = next((item["name"] for item in valid_items if item["name"] in priority), None)
    daily_language = preferred or (valid_items[0]["name"] if valid_items else "JavaScript")
    topics = [
        "variables and data types",
        "functions and control flow",
        "DOM handling and practical examples",
        "debugging and best practices",
        "mini project and review",
    ]
    return {
        "daily_language": daily_language,
        "focus_topic": topics[0],
        "topics": topics[:4],
        "suggestion": f"Today focus on {daily_language} with {topics[0]}, then review a small project to strengthen your understanding.",
    }
