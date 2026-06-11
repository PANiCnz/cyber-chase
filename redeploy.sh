#!/usr/bin/env bash

set -Eeuo pipefail

REPOSITORY_URL="${REPOSITORY_URL:-https://github.com/PANiCnz/cyber-chase.git}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_DIR="$SCRIPT_DIR"
PARENT_DIR="$(dirname -- "$REPOSITORY_DIR")"
DIRECTORY_NAME="$(basename -- "$REPOSITORY_DIR")"
BACKUP_DIR="$PARENT_DIR/.${DIRECTORY_NAME}.redeploy-backup"

if [[ ! -f "$REPOSITORY_DIR/docker-compose.yml" ]]; then
    echo "Error: run this script from the Cyber Chase repository."
    exit 1
fi

if [[ -e "$BACKUP_DIR" ]]; then
    echo "Error: backup directory already exists: $BACKUP_DIR"
    echo "Review or remove it before redeploying."
    exit 1
fi

echo "Stopping the existing Cyber Chase containers..."
cd "$REPOSITORY_DIR"
docker compose down

echo "Moving the current checkout to a temporary backup..."
cd "$PARENT_DIR"
sudo mv "$REPOSITORY_DIR" "$BACKUP_DIR"

echo "Cloning the latest application..."
if ! git clone "$REPOSITORY_URL" "$DIRECTORY_NAME"; then
    echo "Clone failed. Restoring the previous checkout..."
    sudo mv "$BACKUP_DIR" "$REPOSITORY_DIR"
    exit 1
fi

cd "$REPOSITORY_DIR"

if [[ -f "$BACKUP_DIR/data/chasers.json" ]]; then
    echo "Restoring the saved chaser catalog..."
    sudo cp "$BACKUP_DIR/data/chasers.json" "$REPOSITORY_DIR/data/chasers.json"
fi

echo "Building the application without cache..."
docker compose build --no-cache

echo "Starting Cyber Chase..."
docker compose up -d

echo "Removing the previous checkout..."
sudo rm -rf "$BACKUP_DIR"

echo "Cyber Chase redeployment complete."
docker compose ps
