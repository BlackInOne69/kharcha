#!/bin/bash

# Kharcha Application Startup Script
# This script starts both backend and frontend servers

set -e

echo "🚀 Starting Kharcha Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to start backend
start_backend() {
    echo -e "${BLUE}📦 Starting Backend...${NC}"
    cd /home/blackinone/Downloads/kharcha/backend
    source .venv/bin/activate
    
    # Optional: Uncomment and configure if using local PostgreSQL
    # export DATABASE_HOST=127.0.0.1
    # export DATABASE_PORT=5432
    # export DATABASE_NAME=mydb
    # export DATABASE_USER=myuser
    # export DATABASE_PASSWORD=mypassword
    
    python manage.py runserver 0.0.0.0:8000
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}⚛️  Starting Frontend...${NC}"
    cd /home/blackinone/Downloads/kharcha/frontend/kharcha
    source /usr/share/nvm/init-nvm.sh
    nvm use 22
    npx expo start -c
}

# Check if running in a terminal multiplexer or if we can open new terminals
if command -v gnome-terminal &> /dev/null; then
    echo -e "${GREEN}Opening Backend in new terminal...${NC}"
    gnome-terminal -- bash -c "$(declare -f start_backend); start_backend; exec bash"
    
    sleep 2
    
    echo -e "${GREEN}Opening Frontend in new terminal...${NC}"
    gnome-terminal -- bash -c "$(declare -f start_frontend); start_frontend; exec bash"
    
    echo ""
    echo -e "${GREEN}✅ Both servers started in separate terminals!${NC}"
    echo -e "${YELLOW}Backend:${NC} http://localhost:8000"
    echo -e "${YELLOW}Frontend:${NC} http://localhost:8081"
    
elif command -v tmux &> /dev/null; then
    echo -e "${GREEN}Starting in tmux session...${NC}"
    
    # Create new tmux session
    tmux new-session -d -s kharcha
    
    # Split window
    tmux split-window -h
    
    # Start backend in left pane
    tmux send-keys -t kharcha:0.0 "cd /home/blackinone/Downloads/kharcha/backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000" C-m
    
    # Start frontend in right pane
    tmux send-keys -t kharcha:0.1 "cd /home/blackinone/Downloads/kharcha/frontend/kharcha && source /usr/share/nvm/init-nvm.sh && nvm use 22 && npx expo start -c" C-m
    
    # Attach to session
    tmux attach-session -t kharcha
    
else
    echo -e "${YELLOW}⚠️  No terminal multiplexer found. Starting backend only...${NC}"
    echo -e "${YELLOW}Please start frontend manually in another terminal:${NC}"
    echo ""
    echo "cd /home/blackinone/Downloads/kharcha/frontend/kharcha"
    echo "source /usr/share/nvm/init-nvm.sh"
    echo "nvm use 22"
    echo "npx expo start -c"
    echo ""
    
    start_backend
fi
