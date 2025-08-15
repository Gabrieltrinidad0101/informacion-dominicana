all:
	docker compose up -d

projects:
	docker compose up --no-deps rabbitmq mongo

downProjects:
	docker compose down --no-deps rabbitmq mongo

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
	docker compose up postDownload -d --build

extractedText:
	docker compose up extractedText -d --build

analyzeExtractedText:
	docker compose up analyzeExtractedText -d --build

textAnalysisAI:
	docker compose up textAnalysisAI -d --build

insertData:
	docker compose up insertData -d --build

exportToJson:
	docker compose up exportToJson -d --build