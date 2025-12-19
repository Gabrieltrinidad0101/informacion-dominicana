#!/bin/bash

declare -A SERVICES

SERVICES["download_links"]="projects/downloadLinks"
SERVICES["extracted_text"]="projects/extractedText"
SERVICES["download"]="projects/download"
SERVICES["events"]="projects/events"
SERVICES["post_download"]="projects/postDownload"
SERVICES["extracted_text"]="projects/extractedText"
SERVICES["extracted_text_analyzer"]="projects/extractedTextAnalyzer"
SERVICES["ai_text_analyze"]="projects/aiTextAnalyze"
SERVICES["insert_data"]="projects/insertData"
SERVICES["export_to_json"]="projects/exportToJson"
SERVICES["auth"]="projects/auth"
SERVICES["upload_files"]="projects/uploadFiles"

declare -A DEPLOY

DEPLOY["download_links"]="DOKPLOY_DOWNLOAD_LINKS_WEBHOOK"
DEPLOY["extracted_text"]="DOKPLOY_EXTRACTED_TEXT_WEBHOOK"
DEPLOY["download"]="DOKPLOY_DOWNLOAD_WEBHOOK"
DEPLOY["events"]="DOKPLOY_EVENTS_WEBHOOK"
DEPLOY["post_download"]="DOKPLOY_POST_DOWNLOAD_WEBHOOK"
DEPLOY["extracted_text_analyzer"]="DOKPLOY_ANALYZE_EXTRACTED_TEXT_WEBHOOK"
DEPLOY["ai_text_analyze"]="DOKPLOY_AI_TEXT_ANALYZE_WEBHOOK"
DEPLOY["insert_data"]="DOKPLOY_INSERT_DATA_WEBHOOK"
DEPLOY["export_to_json"]="DOKPLOY_EXPORT_TO_JSON_WEBHOOK"
DEPLOY["auth"]="DOKPLOY_AUTH_WEBHOOK"
DEPLOY["upload_files"]="DOKPLOY_UPLOAD_FILES_WEBHOOK"
