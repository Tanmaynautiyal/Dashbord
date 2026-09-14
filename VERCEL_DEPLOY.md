# Deploying Frontend on Vercel

This repository is pre-configured with **`vercel.json`** for seamless React Vite deployment with client-side SPA routing (no 404 on page refresh).

---

## Architecture Overview
- **Frontend (React + Vite)**: Deployed on **Vercel** for lightning-fast global CDN delivery.
- **Backend (FastAPI + PostgreSQL + SMTP)**: Deployed on **Render** (or Railway/VPS) as configured in [`render.yaml`](./render.yaml).

---

## 3-Step Vercel Deployment

### Step 1: Push Changes to GitHub
Make sure your latest code is on GitHub:
```bash
git push origin main
```

---

### Step 2: Import Project on Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository: **`Tanmaynautiyal/Dashbord`**.

---

### Step 3: Configure Project Settings
In the Vercel project configuration screen:

1. **Framework Preset**: Vite
2. **Root Directory**: Select **`frontend`** (or leave as root `/` since root `vercel.json` is also provided).
3. **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   Add the following environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your live backend URL (e.g. `https://dashbord-backend.onrender.com` or your backend server domain).

5. Click **"Deploy"**! 🚀

---

## Verification
- Once deployed, your app will be accessible at `https://<your-project>.vercel.app`.
- React Router pages (`/login`, `/register`, `/explore`, `/profile`) will refresh cleanly without 404 errors due to `vercel.json`.
- The backend has already been configured to allow CORS requests originating from `https://*.vercel.app`.
