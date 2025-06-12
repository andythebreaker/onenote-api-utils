#!/bin/bash

PID_FILE="$HOME/andythebreaker/onenote2html/run.pid"
NODE_PLACE="$HOME/.nvm/versions/node/v23.8.0/bin/node"
SCRIPT_CMD="$HOME/andythebreaker/onenote2html/bin/www"
export PORT=48001
# Restart the script
nohup "$NODE_PLACE" "$SCRIPT_CMD" >> "$HOME/andythebreaker/onenote2html/log.txt" 2>&1 & echo $! > "$PID_FILE"
echo "Process restarted."
