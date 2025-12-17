.PHONY: install install-node install-python install-doppler doppler-connect setup-secrets setup-doppler check help test test-autocomplete test-demo-recorder test-youtube test-reddit test-twitter test-linkedin test-gforms test-spawn-claude install-mcp uninstall-mcp spawn-claude

# Default target
help:
	@echo "Social Starter Pack - Keyword & Market Research Tools"
	@echo ""
	@echo "Installation:"
	@echo "  make install          Install all packages (Node + Python)"
	@echo "  make install-node     Install Node packages (autocomplete-cli, demo-recorder, youtube-cli, twitter-cli)"
	@echo "  make install-python   Install Python packages only (reddit-market-research)"
	@echo "  make install-mcp      Install MCP server + all CLI tools for Claude Code"
	@echo "  make uninstall-mcp    Uninstall MCP server and all CLI tools"
	@echo ""
	@echo "Secrets Management:"
	@echo "  make install-doppler  Install Doppler CLI"
	@echo "  make doppler-connect  Connect to social-starter-pack Doppler project"
	@echo "  make setup-secrets    Create local .env from template (fallback)"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests"
	@echo "  make test-autocomplete"
	@echo "  make test-demo-recorder"
	@echo "  make test-youtube"
	@echo "  make test-twitter"
	@echo "  make test-linkedin"
	@echo "  make test-gforms"
	@echo "  make test-spawn-claude"
	@echo "  make test-reddit"
	@echo ""
	@echo "Utilities:"
	@echo "  make check            Verify all tools are installed and configured"
	@echo "  make autocomplete     Run autocomplete-cli (use ARGS='...' for arguments)"
	@echo "  make reddit           Run reddit-market-research (use ARGS='...' for arguments)"
	@echo "  make youtube          Run youtube-cli (use ARGS='...' for arguments)"
	@echo "  make twitter          Run twitter-cli (use ARGS='...' for arguments)"
	@echo "  make linkedin         Run linkedin-cli (use ARGS='...' for arguments)"
	@echo "  make gforms           Run google-forms-cli (use ARGS='...' for arguments)"
	@echo "  make spawn-claude     Spawn Claude Code in new Ghostty terminal"

# ============================================================================
# Installation
# ============================================================================

install: install-node install-python
	@echo "All packages installed successfully!"

install-node:
	@echo "Installing Node tools from packages/..."
	cd packages/autocomplete-cli && npm install && npm run build && npm link --force
	cd packages/demo-recorder && npm install && npm run build && npm link --force
	cd packages/youtube-cli && npm install && npm run build && npm link --force
	cd packages/twitter-cli && npm install && npm run build && npm link --force
	cd packages/linkedin-cli && npm install && npm run build && npm link --force
	cd packages/google-forms-cli && npm install && npm run build && npm link --force
	cd packages/spawn-claude && npm install && npm run build && npm link --force
	@echo "Done! Run 'autocomplete --help', 'demo-recorder --help', 'youtube --help', 'twitter --help', 'linkedin --help', 'gforms --help', and 'spawn-claude --help' to verify."

install-python:
	@echo "Installing reddit-market-research..."
	uv tool install --force ./packages/reddit-market-research
	@echo "Done! Run 'reddit-market-research --help' to verify."

install-mcp: install-node install-python
	@echo "Installing MCP server for Claude Code..."
	cd packages/mcp-server && npm install && npm run build && npm link --force
	@./scripts/configure-claude-mcp.sh add
	@echo ""
	@echo "Done! Restart Claude Code to use social-tools."

uninstall-mcp:
	@echo "Uninstalling MCP server and CLI tools..."
	@./scripts/configure-claude-mcp.sh remove
	-npm uninstall -g @neonwatty/autocomplete-cli @neonwatty/demo-recorder @neonwatty/youtube-cli @neonwatty/twitter-cli @neonwatty/linkedin-cli @neonwatty/google-forms-cli
	-rm -f "$$(npm root -g)/../bin/social-tools-mcp" 2>/dev/null || true
	-rm -rf "$$(npm root -g)/@neonwatty/social-tools-mcp" 2>/dev/null || true
	-uv tool uninstall reddit-market-research 2>/dev/null || pipx uninstall reddit-market-research 2>/dev/null || pip uninstall -y reddit-market-research 2>/dev/null || true
	@echo "Done! All CLI tools and MCP server have been uninstalled."

# ============================================================================
# Secrets Management
# ============================================================================

# Doppler project config
DOPPLER_PROJECT := social-starter-pack
DOPPLER_CONFIG := dev

install-doppler:
	@if command -v doppler &> /dev/null; then \
		echo "Doppler CLI already installed: $$(doppler --version)"; \
	else \
		echo "Installing Doppler CLI..."; \
		if [ "$$(uname)" = "Darwin" ]; then \
			brew install dopplerhq/cli/doppler; \
		else \
			curl -sLf --retry 3 --tlsv1.2 --proto "=https" "https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key" | sudo gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
			echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/doppler-cli.list && \
			sudo apt-get update && sudo apt-get install -y doppler; \
		fi; \
		echo "Done! Run 'doppler login' to authenticate."; \
	fi

doppler-connect:
	@if ! command -v doppler &> /dev/null; then \
		echo "Error: Doppler CLI not installed. Run 'make install-doppler' first."; \
		exit 1; \
	fi
	@echo "Connecting to Doppler project: $(DOPPLER_PROJECT)/$(DOPPLER_CONFIG)"
	doppler setup --project $(DOPPLER_PROJECT) --config $(DOPPLER_CONFIG)
	@echo ""
	@echo "Verifying secrets..."
	@doppler secrets --only-names

setup-secrets:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from template. Please edit with your credentials."; \
	else \
		echo ".env already exists. Edit manually or delete to regenerate."; \
	fi

# ============================================================================
# Tool Runners (with Doppler/env fallback)
# ============================================================================

# Run autocomplete-cli (no secrets needed)
autocomplete:
	autocomplete $(ARGS)

# Run reddit-market-research with Doppler or .env fallback
reddit:
	@./scripts/run-with-secrets.sh reddit-market-research $(ARGS)

# Run youtube-cli with Doppler or .env fallback
youtube:
	@./scripts/run-with-secrets.sh youtube $(ARGS)

# Run twitter-cli with Doppler or .env fallback
twitter:
	@./scripts/run-with-secrets.sh twitter $(ARGS)

# Run linkedin-cli with Doppler or .env fallback
linkedin:
	@./scripts/run-with-secrets.sh linkedin $(ARGS)

# Run google-forms-cli with Doppler or .env fallback
gforms:
	@./scripts/run-with-secrets.sh gforms $(ARGS)

# Spawn Claude Code in new Ghostty terminal
spawn-claude:
	@./scripts/spawn-claude.sh $(ARGS)

# ============================================================================
# Testing
# ============================================================================

test: test-autocomplete test-demo-recorder test-youtube test-twitter test-linkedin test-gforms test-spawn-claude test-reddit
	@echo "All tests passed!"

test-autocomplete:
	@echo "Testing autocomplete-cli..."
	cd packages/autocomplete-cli && npm test

test-demo-recorder:
	@echo "Testing demo-recorder..."
	cd packages/demo-recorder && npm test

test-youtube:
	@echo "Testing youtube-cli..."
	cd packages/youtube-cli && npm test

test-twitter:
	@echo "Testing twitter-cli..."
	cd packages/twitter-cli && npm test

test-linkedin:
	@echo "Testing linkedin-cli..."
	cd packages/linkedin-cli && npm test

test-gforms:
	@echo "Testing google-forms-cli..."
	cd packages/google-forms-cli && npm test

test-spawn-claude:
	@echo "Testing spawn-claude..."
	cd packages/spawn-claude && npm test

test-reddit:
	@echo "Testing reddit-market-research..."
	cd packages/reddit-market-research && uv run pytest

# ============================================================================
# Verification
# ============================================================================

check:
	@echo "Checking installations..."
	@echo ""
	@echo "Node packages:"
	@if command -v autocomplete &> /dev/null; then \
		echo "  [OK] autocomplete-cli"; \
	else \
		echo "  [MISSING] autocomplete-cli - run 'make install-node'"; \
	fi
	@if command -v demo-recorder &> /dev/null; then \
		echo "  [OK] demo-recorder"; \
	else \
		echo "  [MISSING] demo-recorder - run 'make install-node'"; \
	fi
	@if command -v youtube &> /dev/null; then \
		echo "  [OK] youtube-cli"; \
	else \
		echo "  [MISSING] youtube-cli - run 'make install-node'"; \
	fi
	@if command -v twitter &> /dev/null; then \
		echo "  [OK] twitter-cli (twitter)"; \
	else \
		echo "  [MISSING] twitter-cli - run 'make install-node'"; \
	fi
	@if command -v linkedin &> /dev/null; then \
		echo "  [OK] linkedin-cli (linkedin)"; \
	else \
		echo "  [MISSING] linkedin-cli - run 'make install-node'"; \
	fi
	@if command -v gforms &> /dev/null; then \
		echo "  [OK] google-forms-cli (gforms)"; \
	else \
		echo "  [MISSING] google-forms-cli - run 'make install-node'"; \
	fi
	@if command -v spawn-claude &> /dev/null; then \
		echo "  [OK] spawn-claude"; \
	else \
		echo "  [MISSING] spawn-claude - run 'make install-node'"; \
	fi
	@echo ""
	@echo "Python packages:"
	@if command -v reddit-market-research &> /dev/null; then \
		echo "  [OK] reddit-market-research"; \
	else \
		echo "  [MISSING] reddit-market-research - run 'make install-python'"; \
	fi
	@echo ""
	@echo "MCP server:"
	@if command -v social-tools-mcp &> /dev/null; then \
		echo "  [OK] social-tools-mcp"; \
	else \
		echo "  [MISSING] social-tools-mcp - run 'make install-mcp'"; \
	fi
	@echo ""
	@echo "Secrets configuration:"
	@if command -v doppler &> /dev/null && doppler secrets &> /dev/null 2>&1; then \
		echo "  [OK] Doppler configured"; \
	elif [ -f .env ]; then \
		echo "  [OK] Local .env file found"; \
	else \
		echo "  [MISSING] No secrets configured - run 'make setup-doppler' or 'make setup-secrets'"; \
	fi
