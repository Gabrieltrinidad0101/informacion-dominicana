#!/bin/bash

declare -A SERVICES

SERVICES["download_links"]="projects/downloadLinks"
SERVICES["extracted_text"]="projects/extractedTextV2"
SERVICES["download"]="projects/download"
SERVICES["events"]="projects/events"
SERVICES["post_download"]="projects/postDownload"
SERVICES["extracted_text"]="projects/extractedText"
SERVICES["analyze_extracted_text"]="projects/analyzeExtractedText"
SERVICES["ai_text_analyze"]="projects/aiTextAnalyze"
SERVICES["insert_data"]="projects/insertData"
SERVICES["files_manager"]="projects/filesManager"
SERVICES["export_to_json"]="projects/exportToJson"
SERVICES["nginx"]="projects/apigetway"

declare -A GLOBAL_FILES

GLOBAL_FILES["docker-compose-pro.yml"]="docker-compose-pro.yml"
GLOBAL_FILES["package.json"]="package.json"
