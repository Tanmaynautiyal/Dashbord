#!/bin/bash
# Developer Productivity Hub - Local Development Background Runner

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting Backend (FastAPI on http://localhost:8000)..."
if [ -d "$BASE_DIR/backend/venv" ]; then
    PYTHON_EXEC="$BASE_DIR/backend/venv/bin/python3"
elif [ -d "$BASE_DIR/.venv" ]; then
    PYTHON_EXEC="$BASE_DIR/.venv/bin/python3"
else
    PYTHON_EXEC="python3"
fi

cd "$BASE_DIR/backend"
nohup $PYTHON_EXEC -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$BASE_DIR/.backend.pid"
echo "Backend running (PID: $BACKEND_PID, logs: backend.log)"

echo "Starting Frontend (Vite on http://localhost:3000)..."
cd "$BASE_DIR/frontend"
nohup npm run dev > "$BASE_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$BASE_DIR/.frontend.pid"
echo "Frontend running (PID: $FRONTEND_PID, logs: frontend.log)"

echo "---------------------------------------------------------"
echo "App is running in the background!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "To stop both at any time, run: ./stop-dev.sh"
echo "---------------------------------------------------------"
