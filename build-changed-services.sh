#!/bin/bash
set -e
source ./service-path-map.sh

CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null || echo "NO_PREVIOUS_COMMIT")
echo $CHANGED
for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}

  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  else
    echo "✅ No changes in $SERVICE"
  fi
done
