#!/bin/bash

# Cleverly Development Startup Script
# Starts both frontend and backend servers

set -e

echo "🚀 Starting Cleverly development environment..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
  echo "📦 Starting Redis..."
  brew services start redis
  sleep 2
fi

# Start backend server
echo "🔧 Starting backend server on port 4000..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# Start frontend server
echo "💻 Starting frontend server on port 3000..."
cd client && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   Redis:    localhost:6379"
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait
