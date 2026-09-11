# DevProductivity — Developer Productivity & AI Tools Hub

A modern, full-stack platform built for developers to discover, bookmark, and chat with AI tools, track learning roadmaps, take personalized daily quizzes, receive tech updates, and manage developer workflows.

---

## ⚡ Tech Stack

- **Backend**: FastAPI (Python 3.12), SQLAlchemy 2.0, PostgreSQL (Psycopg 3), Pydantic v2, FastAPI-Mail (aiosmtplib), Argon2 / Pwdlib, PyJWT
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, TanStack Query, Lucide Icons, Recharts

---

## 🚀 Key Features

1. **Email OTP Authentication**:
   - 2-Step user registration with email OTP verification.
   - Clean "Mail sent to `<email>`" notification without leaking codes in the UI.
   - Direct delivery to personal Gmail, Yopmail, Outlook, Yahoo, etc.
   - Forgot Password with email OTP reset flow.
   - Authenticated Change Password management.
2. **Interactive SMTP & Gmail Settings**:
   - In-app configuration for Gmail, Outlook, Yahoo, or custom SMTP servers.
   - Automatic Google App Password formatting and space cleanup.
   - On-demand "Send Test Mail" verification.
3. **AI Tools Catalog**:
   - Curated directory of AI developer tools, chatbots, coding assistants, and agents.
   - Search, filter by category and pricing (Free, Freemium, Paid).
   - Interactive AI chatbot assistant for each tool.
4. **Learning & Productivity**:
   - Daily learning focus with shuffled questions and personalized difficulty (Beginner, Intermediate, Advanced).
   - Real-time AI industry updates and notifications.
   - User bookmarks and activity history.
5. **Admin Dashboard**:
   - Platform analytics, user growth, tool management, scraper integration, and activity logging.

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+ & npm
- PostgreSQL running locally or remotely

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy example environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials, JWT secret, and Gmail/SMTP settings

# Run the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔒 Security
- Passwords hashed using Argon2id.
- JWT-based authentication with Bearer tokens.
- Secure environment management (`.env` ignored in Git).
