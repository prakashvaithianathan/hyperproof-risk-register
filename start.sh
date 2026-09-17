#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "==================================================="
echo "Starting Hyperproof Risk Register (Full Stack)"
echo "==================================================="

# Start backend
echo "Starting Spring Boot Backend on port 8080..."
(cd "$DIR/backend" && mvn spring-boot:run) &
BACKEND_PID=$!

# Start frontend
echo "Starting React Frontend on port 5173..."
(cd "$DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo "==================================================="
echo "Backend:  http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to terminate both servers."
echo "==================================================="

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
