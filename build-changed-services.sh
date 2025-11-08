#!/bin/bash
set -e
source ./service-path-map.sh

# First commit → deploy everything
if [ "$(git rev-list --count HEAD)" -lt 2 ]; then
  echo "🟡 No previous commit detected — deploying ALL services..."
  for SERVICE in "${!SERVICES[@]}"; do
    echo "🚀 Deploying $SERVICE (full deploy)"
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  done
  exit 0
fi

# Normal case → find changed files
CHANGED=$(git diff HEAD~1 HEAD --name-only)
echo "Changed files:"
echo "$CHANGED"

for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}
  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  elif echo "$CHANGED" | grep -q "^$GLOBAL_FILES_PATH/"; then
    echo "🔄 Changes detected in $GLOBAL_FILES_PATH → Rebuilding all services..."
    docker compose -f $GLOBAL_FILES_PATH up -d --build
  else
    echo "✅ No changes in $SERVICE"
  fi
done
