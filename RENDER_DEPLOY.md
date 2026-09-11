# Deploying Developer Productivity Hub on Render

This repository is pre-configured with **`render.yaml` (Render Blueprint)** for instant full-stack deployment.

---

## Method 1: Automatic 1-Click Deployment (Recommended via Blueprint)

1. Push this repository to your GitHub account:
   ```bash
   git push -u origin main
   ```
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** in the top-right corner and select **"Blueprint"**.
4. Connect your GitHub repository (`Tanmaynautiyal/Dashbord`).
5. Render will automatically detect `render.yaml` and configure:
   - **PostgreSQL Database** (`dashbord-db`)
   - **FastAPI Backend Web Service** (`dashbord-backend`)
   - **React Vite Frontend Static Site** (`dashbord-frontend`) with SPA rewrites
6. In the environment variables prompt, enter your Gmail SMTP credentials:
   - `MAIL_USERNAME`: your Gmail address (e.g. `tanmaynautiyalnextstark@gmail.com`)
   - `MAIL_PASSWORD`: your Google App Password (16 characters)
   - `MAIL_FROM`: your Gmail address
7. Click **"Apply"**! Render will deploy all 3 services automatically.

---

## Method 2: Manual Deployment via Render Dashboard

If you prefer to create the services individually:

### Step 1: Create PostgreSQL Database
1. Go to **New +** -> **PostgreSQL**.
2. Name: `dashbord-db`
3. Database: `dashbord`
4. Plan: **Free**
5. Click **Create Database**. Once created, copy the **Internal Database URL**.

---

### Step 2: Deploy the FastAPI Backend (Web Service)
1. Go to **New +** -> **Web Service**.
2. Connect your GitHub repo.
3. Configure the service:
   - **Name**: `dashbord-backend`
   - **Language / Runtime**: `Python 3`
   - **Root Directory**: leave empty
   - **Build Command**: `pip install -r backend/requirements.txt && cd backend && alembic upgrade head`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**
4. Add **Environment Variables**:
   - `DATABASE_URL`: *(paste the Internal Database URL from Step 1)*
   - `JWT_SECRET_KEY`: *(enter a random 32+ character string)*
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
   - `MAIL_SERVER`: `smtp.gmail.com`
   - `MAIL_PORT`: `587`
   - `MAIL_USERNAME`: `tanmaynautiyalnextstark@gmail.com`
   - `MAIL_PASSWORD`: `dxerqihekqjgpbfx`
   - `MAIL_FROM`: `tanmaynautiyalnextstark@gmail.com`
   - `MAIL_FROM_NAME`: `Dev Productivity`
   - `MAIL_STARTTLS`: `True`
   - `MAIL_SSL_TLS`: `False`
   - `MAIL_USE_CREDENTIALS`: `True`
   - `MAIL_VALIDATE_CERTS`: `True`
5. Click **Create Web Service**. Copy the generated URL (e.g. `https://dashbord-backend.onrender.com`).

---

### Step 3: Deploy the React Frontend (Static Site)
1. Go to **New +** -> **Static Site**.
2. Connect your GitHub repo.
3. Configure the site:
   - **Name**: `dashbord-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://dashbord-backend.onrender.com` *(use your backend URL from Step 2)*
5. Under **Redirects / Rewrites**, add:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures React Router routes like `/login`, `/register`, `/profile`, `/explore` work when refreshed)*
6. Click **Create Static Site**.

---

Your website is now live on Render! 🚀
