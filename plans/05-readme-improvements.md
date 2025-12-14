# Plan: README Improvements

**Goal:** Make the repository more discoverable, welcoming, and easy to understand for new users.

---

## Current State

The README currently has:
- Tool table with brief descriptions
- Basic usage examples
- Setup instructions
- Claude Code integration section

**Missing:**
- Why this exists (motivation/story)
- Badges (build status, versions)
- Visual elements (screenshots, diagrams)
- Comparison to alternatives
- Contributing guide link
- Clearer value proposition

---

## Proposed Changes

### 1. Add Header Section with Badges

```markdown
# Social Starter Pack

[![CI](https://github.com/neonwatty/social-starter-pack/actions/workflows/ci.yml/badge.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](...)
[![npm](https://img.shields.io/npm/v/autocomplete-cli)](...)

CLI tools for keyword research, content creation, and social media management.
**Designed to work seamlessly with Claude Code and other AI coding assistants.**
```

### 2. Add "Why This Exists" Section

```markdown
## Why This Exists

I was spending hours every week on content distribution:
- Manually posting to Twitter, LinkedIn, YouTube
- Copying keywords between browser tabs
- Scrolling Reddit for market research

These CLI tools automate the tedious parts so I can focus on creating content.
They're designed specifically to work with AI assistants like Claude Code—just
describe what you want, and the tools do the rest.
```

### 3. Add Workflow Diagram

ASCII or embedded image showing:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Research   │ ──▶ │   Create    │ ──▶ │  Distribute │
│             │     │             │     │             │
│ autocomplete│     │ Claude Code │     │ twitter-cli │
│ reddit-mkt  │     │ + your brain│     │ linkedin-cli│
│             │     │             │     │ youtube-cli │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 4. Add Quick Example Section

```markdown
## Quick Example

Research a topic and post about it:

```bash
# Find what people are searching for
autocomplete google "developer productivity" --expand

# Find real pain points on Reddit
reddit search -s "programming" -k "struggling with" --time month

# Post your insights
twitter post "Here's what I learned about developer productivity..."
linkedin post "Sharing insights from my research..."
```

Or with Claude Code + MCP installed:
> "Search Reddit for developer pain points, summarize them, and post a thread to Twitter"
```

### 5. Add Comparison Section

```markdown
## How It Compares

| Feature | Social Starter Pack | Simplex | Buffer/Hootsuite |
|---------|---------------------|---------|------------------|
| Research tools | ✅ autocomplete, Reddit | ❌ | ❌ |
| Multi-platform posting | ✅ | ✅ | ✅ |
| AI assistant integration | ✅ MCP server | ❌ | ❌ |
| Free & open source | ✅ | ✅ | ❌ |
| CLI-first | ✅ | ✅ | ❌ |
| Demo recording | 🔜 | ❌ | ❌ |
```

### 6. Update Tool Table

Add version badges and npm links to each tool in the table.

### 7. Add Contributing Section

```markdown
## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ideas for contributions:
- New platform integrations (Bluesky, Mastodon, etc.)
- Additional output formats
- Bug fixes and documentation improvements
```

### 8. Add Links Section

```markdown
## Resources

- [Blog posts about these tools](https://neonwatty.com)
- [CLI is All You Need](https://neonwatty.com/posts/claude-code-cli-is-all-you-need/) - Philosophy behind CLI tools + AI
- [Detailed documentation](./docs/)
```

---

## Files to Create/Update

| File | Action | Description |
|------|--------|-------------|
| README.md | Update | All changes above |
| CONTRIBUTING.md | Create | Basic contribution guidelines |
| .github/ISSUE_TEMPLATE/ | Create | Bug report, feature request templates |
| .github/PULL_REQUEST_TEMPLATE.md | Create | PR template |

---

## CONTRIBUTING.md Outline

```markdown
# Contributing to Social Starter Pack

## Getting Started
- Fork the repo
- Clone locally
- `make install` to set up

## Development
- Each tool is in `packages/<tool-name>`
- Run tests: `make test`
- Run linting: `npm run lint` in each package

## Pull Requests
- One feature/fix per PR
- Include tests for new features
- Update relevant documentation

## Ideas for Contributions
- New platform integrations
- Additional export formats
- Documentation improvements
- Bug fixes
```

---

## Issue Templates

### Bug Report
```markdown
**Tool affected:** (e.g., twitter-cli)
**Version:** (e.g., 1.1.0)
**Description:** What happened?
**Expected:** What should have happened?
**Steps to reproduce:**
1.
2.
3.
**Environment:** (OS, Node version, etc.)
```

### Feature Request
```markdown
**Tool:** (or "new tool")
**Description:** What would you like?
**Use case:** Why is this useful?
**Alternatives considered:**
```

---

## Visual Assets Needed

- [ ] Workflow diagram (can be ASCII in README or PNG)
- [ ] Screenshot of terminal showing tools in action
- [ ] (Optional) Logo/banner image

---

## Implementation Order

1. Create CONTRIBUTING.md
2. Create issue/PR templates
3. Update README.md with all sections
4. Add badges (after verifying CI URLs)
5. Add diagram/screenshots

---

## Estimated Effort

- README updates: 1 hour
- CONTRIBUTING.md: 30 minutes
- Templates: 30 minutes
- Badges setup: 15 minutes
- Diagram creation: 30 minutes

---

## Status

- [ ] CONTRIBUTING.md created
- [ ] Issue templates created
- [ ] PR template created
- [ ] README "Why This Exists" section added
- [ ] README badges added
- [ ] README workflow diagram added
- [ ] README quick example added
- [ ] README comparison table added
- [ ] README resources section added
