from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.ai_tool import AITool, AIToolCategory, PricingType
from app.models.content import Category, LearningTopic, Technology, DailyLearningContent
from app.models.quiz import DailyQuiz, DailyQuizQuestion
import app.models  # noqa: F401 Ensure all models are registered

import uuid

DEFAULT_ADMIN_EMAIL = "admin@mail.com"
DEFAULT_ADMIN_PASSWORD = "Mind@123"
DEFAULT_ADMIN_NAME = "Admin"
ADMIN_UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")

DEFAULT_USER_EMAIL = "user@mail.com"
DEFAULT_USER_PASSWORD = "Mind@123"
DEFAULT_USER_NAME = "Demo User"
DEMO_USER_UUID = uuid.UUID("00000000-0000-0000-0000-000000000002")

TANMAY_USER_UUID = uuid.UUID("00000000-0000-0000-0000-000000000003")


def ensure_default_admin() -> dict[str, bool | str]:
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Ensure Admin Account
        admin = db.scalar(select(User).where(User.email == DEFAULT_ADMIN_EMAIL))
        if admin is None:
            admin = User(
                id=ADMIN_UUID,
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
                id=DEMO_USER_UUID,
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
                id=TANMAY_USER_UUID,
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

        # 4. Seed Content & Catalog if empty
        seed_content_if_needed(db)

        return {"created": True, "admin": DEFAULT_ADMIN_EMAIL, "user": DEFAULT_USER_EMAIL}
    finally:
        db.close()


def seed_content_if_needed(db: Session) -> None:
    # ─── AI Tools ────────────────────────────────────────────────────────────
    existing_tools_count = db.scalar(select(func.count()).select_from(AITool)) or 0
    if existing_tools_count == 0:
        ai_tools = [
            dict(name="GitHub Copilot", slug="github-copilot", description="AI pair programmer that suggests code completions inside your editor, supporting dozens of languages.", official_url="https://github.com/features/copilot", category=AIToolCategory.CODING_ASSISTANT, pricing_type=PricingType.FREEMIUM, logo_url="https://github.githubassets.com/images/modules/logos_page/Octocat.png", is_featured=True),
            dict(name="ChatGPT", slug="chatgpt", description="OpenAI's conversational AI assistant capable of writing code, explaining concepts, and answering complex questions.", official_url="https://chat.openai.com", category=AIToolCategory.AI_CHATBOT, pricing_type=PricingType.FREEMIUM, logo_url="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg", is_featured=True),
            dict(name="Cursor", slug="cursor", description="AI-first code editor built on VS Code with deep context awareness and multi-file editing powered by GPT-4.", official_url="https://cursor.sh", category=AIToolCategory.CODING_ASSISTANT, pricing_type=PricingType.FREEMIUM, logo_url="https://cursor.sh/brand/icon.svg", is_featured=True),
            dict(name="Tabnine", slug="tabnine", description="AI code completion tool that learns from your codebase and provides whole-line and full-function completions.", official_url="https://www.tabnine.com", category=AIToolCategory.CODING_ASSISTANT, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=False),
            dict(name="Codeium", slug="codeium", description="Free AI code acceleration toolkit supporting 70+ languages and 40+ editors with fast autocomplete.", official_url="https://codeium.com", category=AIToolCategory.CODING_ASSISTANT, pricing_type=PricingType.FREE, logo_url=None, is_featured=True),
            dict(name="Claude", slug="claude", description="Anthropic's AI assistant focused on safety and helpfulness — great for code review, writing, and analysis.", official_url="https://claude.ai", category=AIToolCategory.AI_CHATBOT, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=True),
            dict(name="Gemini", slug="gemini", description="Google's multimodal AI assistant that understands text, code, images, and more across devices.", official_url="https://gemini.google.com", category=AIToolCategory.AI_CHATBOT, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=True),
            dict(name="Midjourney", slug="midjourney", description="AI image generator accessed through Discord that creates stunning artistic visuals from text prompts.", official_url="https://www.midjourney.com", category=AIToolCategory.IMAGE_GENERATION, pricing_type=PricingType.PAID, logo_url=None, is_featured=True),
            dict(name="Stable Diffusion", slug="stable-diffusion", description="Open-source image generation model you can run locally or via cloud APIs to generate any image.", official_url="https://stability.ai", category=AIToolCategory.IMAGE_GENERATION, pricing_type=PricingType.FREE, logo_url=None, is_featured=False),
            dict(name="Runway ML", slug="runway-ml", description="Creative AI platform for video generation and editing — used by filmmakers and content creators.", official_url="https://runwayml.com", category=AIToolCategory.VIDEO_GENERATION, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=False),
            dict(name="AutoGPT", slug="autogpt", description="Autonomous AI agent that breaks down goals into tasks and executes them using the internet and code.", official_url="https://agpt.co", category=AIToolCategory.AI_AGENT, pricing_type=PricingType.FREE, logo_url=None, is_featured=False),
            dict(name="Windsurf", slug="windsurf", description="Agentic AI IDE by Codeium with deep context flows, inline chat, and multi-file awareness for complex projects.", official_url="https://codeium.com/windsurf", category=AIToolCategory.CODING_ASSISTANT, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=True),
            dict(name="Perplexity AI", slug="perplexity-ai", description="AI-powered search engine that gives cited, conversational answers to complex research questions.", official_url="https://www.perplexity.ai", category=AIToolCategory.AI_CHATBOT, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=True),
            dict(name="Replit AI", slug="replit-ai", description="Browser-based coding environment with integrated AI that helps you write, debug, and deploy code.", official_url="https://replit.com", category=AIToolCategory.DEVELOPER_TOOL, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=False),
            dict(name="v0 by Vercel", slug="v0-by-vercel", description="Generate React/Tailwind UI components from text prompts, powered by Vercel's generative UI system.", official_url="https://v0.dev", category=AIToolCategory.DEVELOPER_TOOL, pricing_type=PricingType.FREEMIUM, logo_url=None, is_featured=True),
        ]
        for t in ai_tools:
            db.add(AITool(**t))
        db.commit()

    # ─── Categories ──────────────────────────────────────────────────────────
    existing_cats = db.scalar(select(func.count()).select_from(Category)) or 0
    if existing_cats == 0:
        categories = [
            dict(name="Programming Languages", slug="programming-languages", description="Learn Python, JavaScript, Java, Go and more"),
            dict(name="Web Development", slug="web-development", description="HTML, CSS, React, Vue, Angular and modern frontend"),
            dict(name="Backend Development", slug="backend-development", description="APIs, servers, FastAPI, Django, Node.js and more"),
            dict(name="Databases", slug="databases", description="SQL, PostgreSQL, MongoDB, Redis and query optimization"),
            dict(name="DevOps & Cloud", slug="devops-cloud", description="Docker, Kubernetes, AWS, CI/CD pipelines"),
            dict(name="AI & Machine Learning", slug="ai-machine-learning", description="ML fundamentals, neural networks, model training"),
            dict(name="Cybersecurity", slug="cybersecurity", description="Ethical hacking, security concepts, OWASP"),
            dict(name="Data Science", slug="data-science", description="Data analysis, visualization, pandas, NumPy"),
        ]
        for c in categories:
            db.add(Category(**c))
        db.commit()

    # ─── Learning Topics ─────────────────────────────────────────────────────
    existing_topics = db.scalar(select(func.count()).select_from(LearningTopic)) or 0
    topic_objs = []
    if existing_topics == 0:
        topics = [
            dict(title="Python Variables & Data Types", description="Understand how Python handles variables, integers, floats, strings, booleans, and type conversion.", difficulty_level="Beginner"),
            dict(title="Python Functions & Scope", description="Learn how to define and call functions, understand local vs global scope, and use lambda expressions.", difficulty_level="Beginner"),
            dict(title="Python Lists, Tuples & Dictionaries", description="Master Python's core data structures — creating, accessing, modifying, and iterating collections.", difficulty_level="Beginner"),
            dict(title="Python OOP — Classes & Objects", description="Object-oriented programming in Python: classes, objects, inheritance, polymorphism, and encapsulation.", difficulty_level="Intermediate"),
            dict(title="Python Async/Await & Asyncio", description="Write non-blocking, asynchronous Python code using async/await syntax and the asyncio event loop.", difficulty_level="Advanced"),
            dict(title="Python Decorators & Generators", description="Learn Python's powerful decorator pattern and lazy evaluation with generator functions and yield.", difficulty_level="Intermediate"),
            dict(title="FastAPI — Building Modern Python APIs", description="Build high-performance Python APIs with FastAPI including routing, dependency injection, and Pydantic validation.", difficulty_level="Intermediate"),
            dict(title="JavaScript ES6+ Features", description="Arrow functions, destructuring, spread operators, template literals, modules, and Promises.", difficulty_level="Beginner"),
            dict(title="JavaScript Async — Promises & Fetch", description="Manage asynchronous operations with Promises, async/await, and the Fetch API for HTTP requests.", difficulty_level="Intermediate"),
            dict(title="TypeScript Generics & Type Narrowing", description="Write reusable, type-safe functions and interfaces with TypeScript generics and control-flow type narrowing.", difficulty_level="Intermediate"),
            dict(title="React Fundamentals — Components & Props", description="Build reusable UI components with React, pass data with props, and understand the component lifecycle.", difficulty_level="Beginner"),
            dict(title="React Hooks — useState & useEffect", description="Manage state and side effects in functional React components with the built-in Hooks API.", difficulty_level="Intermediate"),
            dict(title="REST API Design Best Practices", description="Design clean, scalable REST APIs with proper HTTP methods, status codes, and resource naming.", difficulty_level="Intermediate"),
            dict(title="SQL Basics — SELECT, WHERE, JOIN", description="Write SQL queries to retrieve, filter, and join data across relational database tables.", difficulty_level="Beginner"),
            dict(title="Docker — Containers & Images", description="Containerize applications with Docker, build images with Dockerfiles, and run multi-container apps.", difficulty_level="Intermediate"),
            dict(title="Prompt Engineering Best Practices", description="Craft effective few-shot prompts, chain-of-thought instructions, and structured JSON outputs with LLMs.", difficulty_level="Beginner"),
        ]
        for t in topics:
            obj = LearningTopic(**t)
            db.add(obj)
            topic_objs.append(obj)
        db.commit()
    else:
        topic_objs = list(db.scalars(select(LearningTopic)).all())

    # ─── Technologies ────────────────────────────────────────────────────────
    existing_techs = db.scalar(select(func.count()).select_from(Technology)) or 0
    if existing_techs == 0:
        techs = [
            dict(name="Python", description="General-purpose, beginner-friendly language used in AI, web, automation and data science.", official_url="https://python.org", is_active=True),
            dict(name="JavaScript", description="The language of the web — runs in browsers and Node.js servers worldwide.", official_url="https://developer.mozilla.org/en-US/docs/Web/JavaScript", is_active=True),
            dict(name="React", description="Facebook's declarative UI library for building fast, component-based web interfaces.", official_url="https://react.dev", is_active=True),
            dict(name="FastAPI", description="Modern, fast Python web framework for building APIs with automatic docs generation.", official_url="https://fastapi.tiangolo.com", is_active=True),
            dict(name="PostgreSQL", description="Powerful, open-source relational database system with ACID compliance and rich feature set.", official_url="https://postgresql.org", is_active=True),
            dict(name="Docker", description="Platform for developing, shipping, and running applications in isolated containers.", official_url="https://docker.com", is_active=True),
            dict(name="Git", description="Distributed version control system used by millions of developers worldwide.", official_url="https://git-scm.com", is_active=True),
            dict(name="TypeScript", description="JavaScript with static typing — catches errors at compile time and improves developer productivity.", official_url="https://typescriptlang.org", is_active=True),
        ]
        for t in techs:
            db.add(Technology(**t))
        db.commit()

    # ─── Daily Quiz ──────────────────────────────────────────────────────────
    existing_quiz = db.scalar(select(DailyQuiz))
    if not existing_quiz and topic_objs:
        topic = topic_objs[0]
        quiz = DailyQuiz(id=uuid4(), topic_id=topic.id, date=datetime.now(timezone.utc))
        db.add(quiz)
        db.flush()

        questions = [
            dict(question_text="Which of these is the correct way to declare a variable in Python?", options=["var x = 5", "x = 5", "int x = 5", "let x = 5"], correct_option_index=1),
            dict(question_text="What is the output of: type(3.14)?", options=["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"], correct_option_index=1),
            dict(question_text="Which data type is mutable in Python?", options=["Tuple", "String", "List", "Integer"], correct_option_index=2),
            dict(question_text="What does len([1, 2, 3]) return?", options=["2", "3", "4", "Error"], correct_option_index=1),
            dict(question_text="How do you create an empty dictionary in Python?", options=['dict = []', 'dict = {}', 'dict = ()', 'dict = set()'], correct_option_index=1),
        ]
        for q in questions:
            db.add(DailyQuizQuestion(id=uuid4(), quiz_id=quiz.id, **q))
        db.commit()

    # ─── Daily Learning Content ──────────────────────────────────────────────
    existing_content = db.scalar(select(DailyLearningContent))
    if not existing_content and topic_objs:
        content = DailyLearningContent(
            id=uuid4(),
            topic_id=topic_objs[0].id,
            content_text=(
                "Today's focus: Python Variables & Data Types\n\n"
                "In Python, you don't need to declare a variable's type — it's inferred automatically.\n"
                "Example:\n  name = 'Alice'  # str\n  age = 30        # int\n  pi = 3.14       # float\n"
                "Use type() to check the type of any value. Try it in your terminal!"
            ),
            publish_date=datetime.now(timezone.utc),
        )
        db.add(content)
        db.commit()
