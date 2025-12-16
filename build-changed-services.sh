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
  WEBHOOK="${!KEY_DEPLOY}"


  if echo "$CHANGED" | grep -q "^$PATH_TO_WATCH/"; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → Rebuilding $SERVICE..."
    echo $PACKAGE_TOKEN | docker login -u gabrielopensource --password-stdin ghcr.io
    docker compose -f docker-compose-pro.yml build $SERVICE
    docker tag informacion-dominicana-$SERVICE:latest ghcr.io/gabrieltrinidad0101/informacion-dominicana-$SERVICE:$TAG
    docker push ghcr.io/gabrieltrinidad0101/informacion-dominicana-$SERVICE:$TAG
    if [ "$WEBHOOK" ]; then
      echo "🚀 Deploying $SERVICE via Dokploy..."

      curl -X POST $WEBHOOK \
        -H "Authorization: Bearer $DOKPLOY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"env\": {
            \"IMAGE_TAG\": \"$TAG\"
          }
        }"
    fi
    continue
  fi

  echo "✅ No changes in $SERVICE"
done
