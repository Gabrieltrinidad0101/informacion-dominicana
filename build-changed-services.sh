#!/bin/bash
set -e

declare -A SERVICES

SERVICES["download_links"]="projects/downloadLinks"
SERVICES["extracted_text_v2"]="projects/extractedTextV2"
SERVICES["download"]="projects/download"
SERVICES["events"]="projects/events"
SERVICES["post_download"]="projects/postDownload"
SERVICES["extracted_text"]="projects/extractedText"
SERVICES["analyze_extracted_text"]="projects/analyzeExtractedText"
SERVICES["ai_text_analyze"]="projects/aiTextAnalyze"
SERVICES["insert_data"]="projects/insertData"
SERVICES["files_manager"]="projects/filesManager"
SERVICES["export_to_json"]="projects/exportToJson"

mkdir -p .projects-hashes

for SERVICE in "${!SERVICES[@]}"; do
  PATH_TO_WATCH=${SERVICES[$SERVICE]}
  HASH_FILE=".projects-hashes/$SERVICE.md5"

  # Generate current hash
  CURRENT_HASH=$(find "$PATH_TO_WATCH" -type f -exec md5sum {} + | md5sum | awk '{print $1}')

  # Read stored hash (if exists)
  if [[ -f "$HASH_FILE" ]]; then
      OLD_HASH=$(cat "$HASH_FILE")
  else
      OLD_HASH=""
  fi

  # Compare hashes
  if [[ "$CURRENT_HASH" != "$OLD_HASH" ]]; then
    echo "🔄 Changes detected in $PATH_TO_WATCH → REBUILDING $SERVICE"
    docker compose up "$SERVICE" --build -d
    echo "$CURRENT_HASH" > "$HASH_FILE"
  else
    echo "✅ No changes in $SERVICE"
  fi
done
