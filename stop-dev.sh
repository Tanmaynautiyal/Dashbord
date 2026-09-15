#!/bin/bash
# Developer Productivity Hub - Stop Local Development Background Processes

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping services..."

if [ -f "$BASE_DIR/.backend.pid" ]; then
    PID=$(cat "$BASE_DIR/.backend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        echo "Backend stopped (PID: $PID)"
    fi
    rm -f "$BASE_DIR/.backend.pid"
fi

if [ -f "$BASE_DIR/.frontend.pid" ]; then
    PID=$(cat "$BASE_DIR/.frontend.pid")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null || true
        echo "Frontend stopped (PID: $PID)"
    fi
    rm -f "$BASE_DIR/.frontend.pid"
fi

# Clean up any lingering uvicorn or vite processes on standard ports
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "All services stopped cleanly."
