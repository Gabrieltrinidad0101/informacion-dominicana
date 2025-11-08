#!/bin/bash
set -e
source ./service-path-map.sh

CHANGED=$(git diff --name-only HEAD^ HEAD)

for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}

  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  else
    echo "✅ No changes in $SERVICE"
  fi
done
