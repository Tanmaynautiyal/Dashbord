from datetime import datetime, timezone, date as date_type, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy import select, func, or_, cast, Date
from sqlalchemy.orm import Session

import random
from app.models.content import LearningTopic, DailyLearningContent
from app.models.activity_log import ActivityLog
from app.models.user import User


def is_user_beginner_or_new(db: Session, user: Optional[User]) -> bool:
    """
    Checks if a user is new (low activity or newly joined) and should start with Beginner topics.
    """
    if not user:
        return False

    total_actions = db.scalar(
        select(func.count())
        .select_from(ActivityLog)
        .where(ActivityLog.user_id == user.id)
    ) or 0

    from app.models.quiz import DailyQuizAnswer
    total_quizzes = db.scalar(
        select(func.count())
        .select_from(DailyQuizAnswer)
        .where(DailyQuizAnswer.user_id == user.id)
    ) or 0

    return (total_actions + total_quizzes) <= 2

# Rich curated learning lessons mapped by topic title keywords
CURATED_LESSONS: Dict[str, str] = {
    "Python Variables & Data Types": (
        "💡 Today's Focus: Python Variables & Data Types\n\n"
        "In Python, variables are dynamically typed references to objects in memory.\n"
        "You don't need to declare types manually, but type annotations make your code cleaner and less error-prone.\n\n"
        "```python\n"
        "# Type hints (PEP 484) help IDEs and tools like mypy\n"
        "username: str = 'alex_dev'\n"
        "request_count: int = 142\n"
        "latency_ms: float = 23.85\n"
        "is_authenticated: bool = True\n\n"
        "# Check type at runtime\n"
        "print(f'Type of username: {type(username).__name__}')  # 'str'\n"
        "```\n\n"
        "🔑 Pro Tip: Use `typing.NamedTuple` or dataclasses when grouping related data instead of bare tuples or loose dictionaries."
    ),
    "Python Functions & Scope": (
        "💡 Today's Focus: Python Functions & Variable Scope\n\n"
        "Python resolves variable names using the LEGB rule: Local -> Enclosing -> Global -> Built-in.\n\n"
        "```python\n"
        "TAX_RATE = 0.08  # Global scope\n\n"
        "def calculate_total(subtotal: float, discount: float = 0.0) -> float:\n"
        "    \"\"\"Pure function: returns discounted price plus tax.\"\"\"\n"
        "    taxable_amount = max(0.0, subtotal - discount)\n"
        "    tax = taxable_amount * TAX_RATE\n"
        "    return round(taxable_amount + tax, 2)\n\n"
        "print(calculate_total(100.0, discount=15.0))  # 91.8\n"
        "```\n\n"
        "🔑 Pro Tip: Avoid mutable default arguments (like `def func(items=[])`). Instead use `items: list | None = None` and initialize inside the body."
    ),
    "Python Lists, Tuples & Dictionaries": (
        "💡 Today's Focus: Python Data Structures & Comprehensions\n\n"
        "Lists are mutable sequences, tuples are immutable records, and dicts are O(1) hash maps.\n\n"
        "```python\n"
        "# Dictionary & List comprehensions for clean data transformation\n"
        "users = [\n"
        "    {'id': 1, 'name': 'DevA', 'active': True},\n"
        "    {'id': 2, 'name': 'DevB', 'active': False},\n"
        "    {'id': 3, 'name': 'DevC', 'active': True},\n"
        "]\n\n"
        "# Filter active users into an ID lookup map\n"
        "active_user_map = {u['id']: u['name'] for u in users if u['active']}\n"
        "print(active_user_map)  # {1: 'DevA', 3: 'DevC'}\n"
        "```\n\n"
        "🔑 Pro Tip: Use `.get(key, default)` or `collections.defaultdict` to prevent `KeyError` when looking up uncertain keys."
    ),
    "Python OOP — Classes & Objects": (
        "💡 Today's Focus: Python OOP & Dataclasses\n\n"
        "Modern Python offers `@dataclass` to eliminate boilerplate for classes that primarily store state.\n\n"
        "```python\n"
        "from dataclasses import dataclass, field\n"
        "from datetime import datetime, timezone\n\n"
        "@dataclass(frozen=True)\n"
        "class APIRequest:\n"
        "    endpoint: str\n"
        "    method: str = 'GET'\n"
        "    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))\n\n"
        "req = APIRequest(endpoint='/api/v1/tools')\n"
        "print(req)  # Immutable, auto-generated __repr__ and __eq__\n"
        "```\n\n"
        "🔑 Pro Tip: Use `frozen=True` on dataclasses to make instances hashable and safe from unintended mutation."
    ),
    "Python Async/Await & Asyncio": (
        "💡 Today's Focus: Python Async/Await & Concurrency\n\n"
        "`asyncio` enables cooperative multitasking on a single thread, ideal for I/O-bound operations like database and HTTP requests.\n\n"
        "```python\n"
        "import asyncio\n"
        "import httpx\n\n"
        "async def fetch_status(url: str) -> dict:\n"
        "    async with httpx.AsyncClient() as client:\n"
        "        resp = await client.get(url, timeout=5.0)\n"
        "        return {'url': url, 'status': resp.status_code}\n\n"
        "async def main():\n"
        "    urls = ['https://httpbin.org/get', 'https://api.github.com']\n"
        "    # Run all requests concurrently!\n"
        "    results = await asyncio.gather(*(fetch_status(u) for u in urls))\n"
        "    print(results)\n"
        "```\n\n"
        "🔑 Pro Tip: Never call blocking calls (e.g., `time.sleep` or synchronous `requests.get`) in async defs; use `asyncio.to_thread` if synchronous libraries are unavoidable."
    ),
    "Python Decorators & Generators": (
        "💡 Today's Focus: Decorators & Memory-Efficient Generators\n\n"
        "Decorators wrap function behavior cleanly (for logging, caching, authentication), while generators yield data lazily without storing entire sets in RAM.\n\n"
        "```python\n"
        "import time\n"
        "from functools import wraps\n\n"
        "def timed(func):\n"
        "    @wraps(func)\n"
        "    def wrapper(*args, **kwargs):\n"
        "        start = time.perf_counter()\n"
        "        res = func(*args, **kwargs)\n"
        "        print(f'{func.__name__} took {time.perf_counter() - start:.4f}s')\n"
        "        return res\n"
        "    return wrapper\n\n"
        "# Generator: stream large lines without reading full file\n"
        "def stream_numbers(n: int):\n"
        "    for i in range(n):\n"
        "        yield i * i\n"
        "```\n\n"
        "🔑 Pro Tip: Always use `@wraps(func)` from `functools` inside decorators to preserve docstrings and function names."
    ),
    "FastAPI — Building Modern Python APIs": (
        "💡 Today's Focus: FastAPI & High-Performance Microservices\n\n"
        "FastAPI leverages Python type hints to generate OpenAPI documentation, handle validation, and support async routes out of the box.\n\n"
        "```python\n"
        "from fastapi import FastAPI, Depends, HTTPException, Query\n"
        "from pydantic import BaseModel, Field\n\n"
        "app = FastAPI(title='Tool Catalog API')\n\n"
        "class ToolCreate(BaseModel):\n"
        "    name: str = Field(min_length=2, max_length=100)\n"
        "    category: str\n"
        "    is_active: bool = True\n\n"
        "@app.post('/tools', status_code=201)\n"
        "async def create_tool(tool: ToolCreate):\n"
        "    return {'status': 'success', 'data': tool}\n"
        "```\n\n"
        "🔑 Pro Tip: Use FastAPI dependency injection (`Depends`) for database sessions and authentication to keep route handlers clean and testable."
    ),
    "TypeScript Generics & Type Narrowing": (
        "💡 Today's Focus: TypeScript Generics & Type Narrowing\n\n"
        "Generics allow you to write reusable, type-safe functions and interfaces without losing type information.\n\n"
        "```typescript\n"
        "interface ApiResponse<T> {\n"
        "  data: T;\n"
        "  status: 'success' | 'error';\n"
        "  timestamp: number;\n"
        "}\n\n"
        "// Generic fetcher preserves the specific return type\n"
        "async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {\n"
        "  const res = await fetch(url);\n"
        "  const json = await res.json();\n"
        "  return { data: json, status: 'success', timestamp: Date.now() };\n"
        "}\n"
        "```\n\n"
        "🔑 Pro Tip: Use type guards (e.g. `typeof`, `in`, or custom functions `x is MyType`) to narrow union types safely."
    ),
    "JavaScript Async — Promises & Fetch": (
        "💡 Today's Focus: JavaScript Async Flow & Promise Combinators\n\n"
        "Mastering Promise combinators (`allSettled`, `race`, `any`) prevents unhandled rejections from crashing batch tasks.\n\n"
        "```javascript\n"
        "const urls = ['/api/users', '/api/analytics', '/api/notifications'];\n\n"
        "// Promise.allSettled guarantees all promises complete regardless of individual failures\n"
        "const results = await Promise.allSettled(\n"
        "  urls.map(url => fetch(url).then(r => r.json()))\n"
        ");\n\n"
        "const successfulData = results\n"
        "  .filter(r => r.status === 'fulfilled')\n"
        "  .map(r => r.value);\n"
        "```\n\n"
        "🔑 Pro Tip: Use `AbortController` to cancel in-flight HTTP requests when components unmount or search terms change."
    ),
    "React Hooks — useState & useEffect": (
        "💡 Today's Focus: React Hooks & Clean Side-Effect Lifecycles\n\n"
        "`useEffect` synchronizes your component with external systems. Always clean up subscriptions or timers!\n\n"
        "```tsx\n"
        "import React, { useState, useEffect } from 'react';\n\n"
        "export function WindowWidthTracker() {\n"
        "  const [width, setWidth] = useState(window.innerWidth);\n\n"
        "  useEffect(() => {\n"
        "    const handleResize = () => setWidth(window.innerWidth);\n"
        "    window.addEventListener('resize', handleResize);\n"
        "    // Cleanup prevents memory leaks\n"
        "    return () => window.removeEventListener('resize', handleResize);\n"
        "  }, []); // Empty deps = run once on mount\n\n"
        "  return <span className=\"font-mono\">Width: {width}px</span>;\n"
        "}\n"
        "```\n\n"
        "🔑 Pro Tip: Never declare helper functions inside `useEffect` dependencies unless wrapped in `useCallback`."
    ),
    "React Performance & Memoization": (
        "💡 Today's Focus: React Memoization (useMemo, useCallback, React.memo)\n\n"
        "Prevent unnecessary re-renders in heavy components by caching expensive calculations and callback references.\n\n"
        "```tsx\n"
        "import React, { useMemo, useCallback } from 'react';\n\n"
        "// Memoize expensive calculation\n"
        "const filteredCatalog = useMemo(() => {\n"
        "  return items.filter(item => item.rating >= minRating && item.active);\n"
        "}, [items, minRating]);\n\n"
        "// Stable function reference for child components\n"
        "const handleSelect = useCallback((id: string) => {\n"
        "  trackAnalytics('item_clicked', id);\n"
        "}, []);\n"
        "```\n\n"
        "🔑 Pro Tip: Don't over-memoize simple primitives; memoization has a slight memory and comparison overhead. Reserve it for expensive computations or dependencies."
    ),
    "Next.js Server Components & App Router": (
        "💡 Today's Focus: Next.js React Server Components (RSC)\n\n"
        "Server Components execute exclusively on the server, streaming HTML directly with zero bundle cost for server-only dependencies.\n\n"
        "```tsx\n"
        "// app/tools/page.tsx - Server Component by default\n"
        "import db from '@/lib/db';\n\n"
        "export default async function ToolsPage() {\n"
        "  // Direct database access without exposing credentials or endpoints to browser!\n"
        "  const tools = await db.aiTools.findMany({ where: { isFeatured: true } });\n\n"
        "  return (\n"
        "    <main className=\"p-8\">\n"
        "      <h1 className=\"text-2xl font-bold\">Featured AI Tools</h1>\n"
        "      <ul>{tools.map(t => <li key={t.id}>{t.name}</li>)}</ul>\n"
        "    </main>\n"
        "  );\n"
        "}\n"
        "```\n\n"
        "🔑 Pro Tip: Add `'use client'` only to leaf components that need user interaction, DOM events, or browser APIs."
    ),
    "SQL Basics — SELECT, WHERE, JOIN": (
        "💡 Today's Focus: SQL Joins & Relational Data Fetching\n\n"
        "Writing expressive, index-friendly SQL queries is a foundational skill for every backend engineer.\n\n"
        "```sql\n"
        "-- Retrieve users along with their completed quiz count and latest score\n"
        "SELECT \n"
        "    u.id,\n"
        "    u.name,\n"
        "    COUNT(a.id) AS total_quizzes_taken,\n"
        "    COALESCE(AVG(a.score), 0) AS average_score\n"
        "FROM users u\n"
        "LEFT JOIN daily_quiz_answers a ON u.id = a.user_id\n"
        "WHERE u.is_active = TRUE\n"
        "GROUP BY u.id, u.name\n"
        "HAVING COUNT(a.id) > 0\n"
        "ORDER BY average_score DESC;\n"
        "```\n\n"
        "🔑 Pro Tip: Use `LEFT JOIN` when child records might not exist, and always test query execution plans with `EXPLAIN ANALYZE`."
    ),
    "PostgreSQL Indexing & Query Optimization": (
        "💡 Today's Focus: PostgreSQL B-Tree & Partial Indexes\n\n"
        "The right index can turn a multi-second table scan into a sub-millisecond index lookup.\n\n"
        "```sql\n"
        "-- Composite index ordered by highest selectivity first\n"
        "CREATE INDEX idx_user_activity_created ON activity_logs (user_id, created_at DESC);\n\n"
        "-- Partial index: only index active items, saving memory and disk space\n"
        "CREATE INDEX idx_active_featured_tools \n"
        "ON ai_tools (created_at DESC) \n"
        "WHERE is_active = TRUE AND is_featured = TRUE;\n"
        "```\n\n"
        "🔑 Pro Tip: Partial indexes (`WHERE condition`) reduce index maintenance overhead on high-throughput write tables."
    ),
    "Docker — Containers & Images": (
        "💡 Today's Focus: Docker Multi-Stage Builds & Containerization\n\n"
        "Multi-stage builds dramatically reduce container image size and eliminate security vulnerabilities by discarding build tools.\n\n"
        "```dockerfile\n"
        "# Stage 1: Build\n"
        "FROM node:20-alpine AS builder\n"
        "WORKDIR /app\n"
        "COPY package*.json ./\n"
        "RUN npm ci\n"
        "COPY . .\n"
        "RUN npm run build\n\n"
        "# Stage 2: Minimal Production Image\n"
        "FROM nginx:alpine\n"
        "COPY --from=builder /app/dist /usr/share/nginx/html\n"
        "EXPOSE 80\n"
        "CMD [\"nginx\", \"-g\", \"daemon off;\"]\n"
        "```\n\n"
        "🔑 Pro Tip: Always place files that change least (like dependency package.json) earlier in Dockerfile to maximize cache reuse."
    ),
    "Kubernetes Pods, Deployments & Services": (
        "💡 Today's Focus: Kubernetes Core Primitives & Zero-Downtime Rollouts\n\n"
        "Kubernetes Deployments ensure self-healing and zero-downtime rolling updates for containerized microservices.\n\n"
        "```yaml\n"
        "apiVersion: apps/v1\n"
        "kind: Deployment\n"
        "metadata:\n"
        "  name: dashboard-api\n"
        "spec:\n"
        "  replicas: 3\n"
        "  strategy:\n"
        "    type: RollingUpdate\n"
        "    rollingUpdate:\n"
        "      maxSurge: 1\n"
        "      maxUnavailable: 0\n"
        "  template:\n"
        "    spec:\n"
        "      containers:\n"
        "      - name: api\n"
        "        image: dashboard-api:v2.1\n"
        "        ports:\n"
        "        - containerPort: 8000\n"
        "```\n\n"
        "🔑 Pro Tip: Always specify CPU and memory `requests` and `limits` so Kubernetes scheduler can distribute workloads effectively."
    ),
    "Caching Strategies with Redis": (
        "💡 Today's Focus: Redis Cache-Aside & TTL Invalidation\n\n"
        "The Cache-Aside pattern minimizes database load for read-heavy operations while keeping latency in the single digits.\n\n"
        "```python\n"
        "import json\n"
        "import redis\n\n"
        "r = redis.Redis(host='localhost', port=6379, decode_responses=True)\n\n"
        "def get_user_profile(user_id: str, db_fetch_fn):\n"
        "    cache_key = f'user:{user_id}:profile'\n"
        "    cached = r.get(cache_key)\n"
        "    if cached:\n"
        "        return json.loads(cached)  # Cache hit (< 2ms)\n\n"
        "    # Cache miss: fetch from PostgreSQL\n"
        "    profile = db_fetch_fn(user_id)\n"
        "    # Set with 10-minute expiration\n"
        "    r.setex(cache_key, 600, json.dumps(profile))\n"
        "    return profile\n"
        "```\n\n"
        "🔑 Pro Tip: Always include a TTL (Time To Live) to prevent stale cache entries from persisting forever."
    ),
    "REST API Design Best Practices": (
        "💡 Today's Focus: Clean REST API Design & HTTP Status Codes\n\n"
        "Well-designed REST APIs use nouns for resources, predictable nesting, and appropriate HTTP response codes.\n\n"
        "```http\n"
        "GET    /api/v1/tools?category=ai&page=1   -> 200 OK (List items)\n"
        "POST   /api/v1/tools                      -> 201 Created (Return Location header)\n"
        "GET    /api/v1/tools/{id}                 -> 200 OK or 404 Not Found\n"
        "PUT    /api/v1/tools/{id}                 -> 200 OK (Full replace)\n"
        "PATCH  /api/v1/tools/{id}                 -> 200 OK (Partial update)\n"
        "DELETE /api/v1/tools/{id}                 -> 204 No Content\n"
        "```\n\n"
        "🔑 Pro Tip: Standardize error payloads using RFC 7807 (Problem Details for HTTP APIs) with fields like `title`, `status`, and `detail`."
    ),
    "Microservices Architecture & Event-Driven Systems": (
        "💡 Today's Focus: Event-Driven Microservices & Message Brokers\n\n"
        "Decoupling services through asynchronous events (e.g. RabbitMQ or Kafka) increases fault tolerance and system resilience.\n\n"
        "```python\n"
        "# Producer emits an event without waiting for dependent services\n"
        "def on_user_registered(user_data: dict):\n"
        "    event = {\n"
        "        'event_type': 'USER_REGISTERED',\n"
        "        'user_id': user_data['id'],\n"
        "        'email': user_data['email'],\n"
        "        'timestamp': datetime.utcnow().isoformat()\n"
        "    }\n"
        "    message_bus.publish(topic='user.events', payload=event)\n"
        "    # Email service, analytics service, and notification service consume independently!\n"
        "```\n\n"
        "🔑 Pro Tip: Design event consumers to be idempotent so reprocessing duplicate messages produces no harmful side effects."
    ),
    "Prompt Engineering Best Practices": (
        "💡 Today's Focus: Modern LLM Prompt Engineering & Few-Shot Prompting\n\n"
        "High-performance prompts provide clear roles, explicit constraints, input/output delimiters, and concrete few-shot examples.\n\n"
        "```text\n"
        "System: You are an expert code refactoring assistant. Always reply in valid JSON.\n\n"
        "Instructions:\n"
        "1. Identify time complexity issues in the user's snippet.\n"
        "2. Provide an optimized solution.\n"
        "3. Include unit tests.\n\n"
        "Format schema:\n"
        "{\n"
        "  \"original_complexity\": \"O(...)\",\n"
        "  \"optimized_complexity\": \"O(...)\",\n"
        "  \"refactored_code\": \"...\",\n"
        "  \"explanation\": \"...\"\n"
        "}\n"
        "```\n\n"
        "🔑 Pro Tip: Chain-of-thought prompting (\"Think step by step before outputting the final answer\") significantly improves LLM accuracy on logic and mathematics."
    ),
    "Retrieval-Augmented Generation (RAG) Architecture": (
        "💡 Today's Focus: Retrieval-Augmented Generation (RAG)\n\n"
        "RAG bridges private internal documents with LLMs by converting text into vector embeddings and retrieving context dynamically.\n\n"
        "```python\n"
        "# 1. Embed query -> 2. Vector search -> 3. Augment LLM prompt\n"
        "def answer_user_query(query: str, vector_store, llm_client):\n"
        "    # Retrieve top 3 most relevant document chunks\n"
        "    relevant_docs = vector_store.similarity_search(query, k=3)\n"
        "    context_str = \"\\n---\\n\".join([d.page_content for d in relevant_docs])\n\n"
        "    prompt = f\"\"\"\n"
        "    Context Information:\n"
        "    {context_str}\n\n"
        "    Question: {query}\n"
        "    Answer strictly based on the context above.\n"
        "    \"\"\"\n"
        "    return llm_client.generate(prompt)\n"
        "```\n\n"
        "🔑 Pro Tip: Chunk size and overlap matter: 500-1000 tokens with a 10-15% overlap typically yields the best retrieval quality."
    ),
    "OWASP Top 10 Web Vulnerabilities": (
        "💡 Today's Focus: Web Security & OWASP Top 10 Defenses\n\n"
        "Securing web applications requires defense in depth: parameterized queries against SQLi, sanitized inputs against XSS, and proper auth validation.\n\n"
        "```python\n"
        "# Vulnerable to SQL Injection (NEVER do this):\n"
        "# query = f\"SELECT * FROM users WHERE email = '{user_input}'\"\n\n"
        "# SECURE: Parameterized query (SQLAlchemy / ORM):\n"
        "stmt = select(User).where(User.email == user_input)\n"
        "user = db.scalar(stmt)\n"
        "```\n\n"
        "🔑 Pro Tip: Never roll your own password hashing; use industry-standard algorithms like Argon2id or bcrypt with appropriate work factors."
    ),
    "Git & GitHub — Version Control Workflow": (
        "💡 Today's Focus: Git Branching Strategies & Clean Git History\n\n"
        "Keeping an atomic commit history with interactive rebase makes pull requests effortless to review and revert.\n\n"
        "```bash\n"
        "# Create and switch to a feature branch\n"
        "git checkout -b feature/dynamic-learning-topics\n\n"
        "# Interactive rebase to squash fixup commits before opening PR\n"
        "git rebase -i HEAD~3\n\n"
        "# Rebase feature branch on latest main without unnecessary merge commits\n"
        "git fetch origin\n"
        "git rebase origin/main\n"
        "```\n\n"
        "🔑 Pro Tip: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`) to allow automated changelog and semantic versioning."
    ),
    "Building Autonomous AI Agents": (
        "💡 Today's Focus: Autonomous AI Agents & Tool Calling\n\n"
        "AI Agents use a ReAct (Reason + Act) loop: they examine user goals, decide which tools to execute, inspect the output, and iteratively solve tasks.\n\n"
        "```python\n"
        "TOOLS = [\n"
        "    {\"name\": \"run_sql_query\", \"description\": \"Execute read-only SQL queries\"},\n"
        "    {\"name\": \"search_docs\", \"description\": \"Search developer documentation\"}\n"
        "]\n\n"
        "# Agent Loop:\n"
        "# 1. Prompt LLM with available tools and state\n"
        "# 2. Parse tool call argument\n"
        "# 3. Execute tool locally\n"
        "# 4. Feed result back to LLM until final answer is achieved\n"
        "```\n\n"
        "🔑 Pro Tip: Set strict timeout and maximum iteration limits on agent loops to prevent recursive runaway tasks."
    ),
}

def generate_default_content_for_topic(topic: LearningTopic) -> str:
    """Fallback generator for any learning topic to ensure rich, structured daily content."""
    return (
        f"💡 Today's Focus: {topic.title}\n\n"
        f"{topic.description}\n\n"
        f"Level: {topic.difficulty_level}\n\n"
        f"Key Concept:\n"
        f"- Understand the core principles and design patterns behind {topic.title}.\n"
        f"- Practice hands-on code exercises and test implementations.\n"
        f"- Review edge cases and real-world production performance considerations.\n\n"
        f"🔑 Pro Tip: Ask our built-in AI Tutor to explain {topic.title} with interactive code examples!"
    )


def get_or_create_daily_learning_content(
    db: Session,
    user: Optional[User] = None,
    target_date: Optional[date_type] = None,
) -> Optional[Dict[str, Any]]:
    """
    Returns the daily learning focus.
    If the user is a new/beginner user, starts with a foundational Beginner topic.
    For established users, automatically rotates through the curriculum with per-user variety.
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    # Check if user is new or has low activity
    is_new = is_user_beginner_or_new(db, user)

    # Get topics pool
    if is_new:
        topics = db.scalars(
            select(LearningTopic)
            .where(LearningTopic.difficulty_level.ilike("Beginner"))
            .order_by(LearningTopic.created_at.asc())
        ).all()
        if not topics:
            topics = db.scalars(select(LearningTopic).order_by(LearningTopic.created_at.asc())).all()
    else:
        topics = db.scalars(select(LearningTopic).order_by(LearningTopic.created_at.asc())).all()

    if not topics:
        return None

    # Deterministic index for this user and calendar day
    day_ordinal = target_date.toordinal()
    if user:
        user_seed = int(user.id.hex[:6], 16)
        topic_index = (day_ordinal + user_seed) % len(topics)
    else:
        topic_index = day_ordinal % len(topics)

    selected_topic = topics[topic_index]

    # Retrieve curated lesson or generate one
    lesson_text = CURATED_LESSONS.get(selected_topic.title, generate_default_content_for_topic(selected_topic))

    return {
        "id": str(uuid4()),
        "topic_id": str(selected_topic.id),
        "topic_title": selected_topic.title,
        "difficulty_level": selected_topic.difficulty_level,
        "content_text": lesson_text,
        "publish_date": datetime.now(timezone.utc).isoformat(),
        "date_formatted": target_date.strftime("%A, %B %d, %Y"),
        "is_beginner_onboarding": is_new,
    }


def get_daily_recommended_topics(
    db: Session,
    user: Optional[User] = None,
    target_date: Optional[date_type] = None,
    shuffle_offset: int = 0,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Returns a rotating, diverse selection of recommended topics.
    Shuffles automatically and uniquely per user so different users see different topics when they enter!
    For new users, Beginner topics are prioritized.
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    all_topics = db.scalars(select(LearningTopic).order_by(LearningTopic.created_at.asc())).all()
    if not all_topics:
        return []

    is_new = is_user_beginner_or_new(db, user)
    day_seed = target_date.toordinal()
    user_seed = int(user.id.hex[:6], 16) if user else 42

    rng = random.Random(user_seed + day_seed * 7 + shuffle_offset * 101)

    if is_new:
        # Prioritize Beginner topics first for new users
        beginner_topics = [t for t in all_topics if t.difficulty_level.lower() == "beginner"]
        other_topics = [t for t in all_topics if t.difficulty_level.lower() != "beginner"]
        rng.shuffle(beginner_topics)
        rng.shuffle(other_topics)
        combined = beginner_topics + other_topics
        selected = combined[:limit]
    else:
        # Full shuffled variety per user
        shuffled_topics = list(all_topics)
        rng.shuffle(shuffled_topics)
        selected = shuffled_topics[:limit]

    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "difficulty_level": t.difficulty_level,
        }
        for t in selected
    ]


def get_all_topics(
    db: Session,
    search: Optional[str] = None,
    difficulty: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Returns all learning topics with optional search and difficulty filtering."""
    stmt = select(LearningTopic).order_by(LearningTopic.title.asc())

    if difficulty and difficulty.lower() != "all":
        stmt = stmt.where(LearningTopic.difficulty_level.ilike(difficulty))

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                LearningTopic.title.ilike(search_pattern),
                LearningTopic.description.ilike(search_pattern),
            )
        )

    results = db.scalars(stmt).all()
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "difficulty_level": t.difficulty_level,
        }
        for t in results
    ]


def calculate_user_streak(db: Session, user_id: UUID) -> int:
    """
    Calculates consecutive active days for the user based on ActivityLog and DailyQuizAnswer.
    A day is active if the user performed at least one action (quiz, study, login, tool exploration) on that calendar date.
    """
    stmt = (
        select(cast(ActivityLog.created_at, Date))
        .where(ActivityLog.user_id == user_id)
        .distinct()
    )
    active_dates = set(db.scalars(stmt).all())

    # Also include quiz answers
    from app.models.quiz import DailyQuizAnswer
    quiz_stmt = (
        select(cast(DailyQuizAnswer.created_at, Date))
        .where(DailyQuizAnswer.user_id == user_id)
        .distinct()
    )
    active_dates.update(db.scalars(quiz_stmt).all())

    if not active_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0

    # Start checking from today
    check_date = today
    if check_date not in active_dates:
        # If user hasn't acted yet today, check if active yesterday to keep streak alive
        check_date = today - timedelta(days=1)

    while check_date in active_dates:
        streak += 1
        check_date -= timedelta(days=1)

    return streak

