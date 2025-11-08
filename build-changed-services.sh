#!/bin/bash
set -e
source ./service-path-map.sh

# Check if repo has at least 2 commits
if [ "$(git rev-list --count HEAD)" -lt 2 ]; then
  echo "🟡 No previous commit detected — deploying ALL services..."
  for SERVICE in "${!SERVICES[@]}"; do
    echo "🚀 Deploying $SERVICE (full deploy due to first commit)"
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  done
  exit 0
fi

# Normal behavior (diff changed services)

CHANGED=$(git diff HEAD~1 HEAD --name-only 2>/dev/null || echo "NO_PREVIOUS_COMMIT")
echo "Changed files:"
echo "$CHANGED"

for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}

  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    docker compose -f docker-compose-pro.yml up $SERVICE -d --build
  else
    echo "✅ No changes in $SERVICE"
  fi
done
