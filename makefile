all:
	docker compose up -d

projects:
	docker compose up --no-deps grafana promtail loki

downProjects:
	docker compose down  --no-deps grafana promtail loki

reStartProjects:
	docker compose restart download download_links events post_download extracted_text analyze_extracted_text ai_text_analyze insert_data export_to_json files_manager

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose build --no-cache

restart:
	docker compose restart

download:
	docker compose up download -d --build

downloadLinks:
	docker compose up download_links -d --build

events:
	docker compose up events -d --build

frontend:
	docker compose up frontend -d --build

postDownload:
	docker compose up post_download -d --build

extractedText:
	docker compose up extracted_text -d --build

analyzeExtractedText:
	docker compose up analyze_extracted_text -d --build

aiTextAnalyze:
	docker compose up ai_text_analyze -d --build

insertData:
	docker compose up insert_data -d --build

exportToJson:
	docker compose up export_to_json -d --build
	
filesManager:
	docker compose up files_manager -d --build

removeDownload:
	docker compose down download