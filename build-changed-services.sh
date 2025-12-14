#!/bin/bash
set -e
source ./service-path-map.sh

# Normal case → find changed files
CHANGED=$(git diff HEAD~1 HEAD --name-only)
echo "Changed files:"
echo "$CHANGED"

for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}
  KEY_DEPLOY=${DEPLOY[$SERVICE]}

  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    echo $PACKAGE_TOKEN | docker login -u gabrielopensource --password-stdin ghcr.io
    docker compose -f docker-compose-pro.yml build $SERVICE
    docker tag informacion-dominicana-$SERVICE:latest ghcr.io/gabrieltrinidad0101/informacion-dominicana-$SERVICE:latest
    docker push ghcr.io/gabrieltrinidad0101/informacion-dominicana-$SERVICE:latest
    curl -X POST $KEY_DEPLOY
    continue
  fi

  echo "✅ No changes in $SERVICE"
done
