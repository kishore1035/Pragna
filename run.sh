#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "==================================================="
echo "Starting Pragna AI System..."
echo "==================================================="

# Find Python in backend venv
if [ -f "$DIR/backend/.venv/bin/python" ]; then
    PYTHON="$DIR/backend/.venv/bin/python"
elif [ -f "$DIR/backend/venv/bin/python" ]; then
    PYTHON="$DIR/backend/venv/bin/python"
else
    PYTHON="python3"
fi

echo "Starting FastAPI Backend on http://localhost:8000..."
(cd "$DIR/backend" && "$PYTHON" -m uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting Next.js UI on http://localhost:4028..."
(cd "$DIR" && npm run dev) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "Servers stopped."
}

trap cleanup INT TERM EXIT

echo ""
echo "Both servers are running!"
echo "UI URL:      http://localhost:4028"
echo "Backend API: http://localhost:8000"
echo "Press Ctrl+C to stop both servers."
echo "==================================================="

wait
