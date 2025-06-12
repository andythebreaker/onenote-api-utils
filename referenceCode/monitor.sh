#!/bin/bash

PID_FILE="$HOME/andythebreaker/onenote2html/run.pid"
NODE_PLACE="$HOME/.nvm/versions/node/v23.8.0/bin/node"
SCRIPT_CMD="$HOME/andythebreaker/onenote2html/bin/www"
export PORT=48001
# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    # Check if process is running
    if ps -p $PID > /dev/null 2>&1; then
        echo "Process is running."
        exit 0
    else
        echo "Process not found. Restarting..."
    fi
else
    echo "PID file not found. Starting process..."
fi

# Restart the script
nohup "$NODE_PLACE" "$SCRIPT_CMD" >> "$HOME/andythebreaker/onenote2html/log.txt" 2>&1 & echo $! > "$PID_FILE"
echo "Process restarted."

