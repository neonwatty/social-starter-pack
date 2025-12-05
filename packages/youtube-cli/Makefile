.PHONY: install build doppler-connect auth list upload update clone validate help

help:
	@echo "YouTube Shorts CLI"
	@echo ""
	@echo "Setup:"
	@echo "  make install         Install dependencies and build"
	@echo "  make doppler-connect Connect to Doppler for secrets"
	@echo ""
	@echo "Commands:"
	@echo "  make auth            Authenticate with YouTube"
	@echo "  make list            List your videos"
	@echo "  make upload          Upload a video"
	@echo "  make update          Update video metadata"
	@echo "  make clone           Clone a video with new metadata"
	@echo "  make validate        Validate video for Shorts"
	@echo ""
	@echo "Examples:"
	@echo "  make list ARGS='--max 20'"
	@echo "  make upload ARGS='video.mp4 -t \"My Short\"'"
	@echo "  make update ARGS='abc123 --title \"New Title\"'"

install:
	npm install && npm run build && npm link

build:
	npm run build

doppler-connect:
	doppler setup --project social-starter-pack --config dev

auth:
	@./scripts/run-with-secrets.sh yt-shorts auth

list:
	@./scripts/run-with-secrets.sh yt-shorts list $(ARGS)

upload:
	@./scripts/run-with-secrets.sh yt-shorts upload $(ARGS)

update:
	@./scripts/run-with-secrets.sh yt-shorts update $(ARGS)

clone:
	@./scripts/run-with-secrets.sh yt-shorts clone $(ARGS)

validate:
	@./scripts/run-with-secrets.sh yt-shorts validate $(ARGS)
