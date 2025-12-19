#!/bin/bash
# Deployment script for meghdoot
# Run this on the server after git pull

set -e

# Lock file to prevent concurrent deployments
LOCK_FILE="/tmp/qrcode-artistic-deploy.lock"
LOCK_TIMEOUT=300  # 5 minutes max wait

# Function to acquire lock
acquire_lock() {
    local lock_pid
    local wait_time=0

    while [ $wait_time -lt $LOCK_TIMEOUT ]; do
        if (set -C; echo $$ > "$LOCK_FILE") 2>/dev/null; then
            # Lock acquired
            trap "rm -f $LOCK_FILE" EXIT INT TERM
            return 0
        fi

        # Check if lock is stale (process no longer exists)
        if [ -f "$LOCK_FILE" ]; then
            lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
            if [ -n "$lock_pid" ] && ! kill -0 "$lock_pid" 2>/dev/null; then
                # Stale lock, remove it
                rm -f "$LOCK_FILE"
                continue
            fi
        fi

        echo "Waiting for deployment lock (waited ${wait_time}s)..."
        sleep 5
        wait_time=$((wait_time + 5))
    done

    echo "Error: Could not acquire deployment lock after ${LOCK_TIMEOUT}s"
    exit 1
}

# Acquire lock before proceeding
acquire_lock

cd /opt/docker/qrcode-artistic

echo "Pulling latest changes..."
git pull origin main

echo "Stopping containers..."
docker compose down

echo "Building containers with cache..."
DOCKER_BUILDKIT=1 docker compose build

echo "Starting containers..."
docker compose up -d

echo "Waiting for services to be healthy..."
sleep 5

echo "Checking container status..."
docker compose ps

echo "Deployment complete!"
