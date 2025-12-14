# Plan: Workflow Documentation

**Goal:** Add workflow examples to the docs/ folder showing how to combine tools for common use cases.

---

## Why Workflow Docs?

Current documentation covers individual tools well, but doesn't show:
- How tools work together
- Common real-world use cases
- Best practices for combined workflows
- Integration with Claude Code for multi-step operations

---

## Proposed Workflows

### Workflow 1: Reddit Research → Content Creation

**File:** `docs/workflows/reddit-to-content.md`

```markdown
# Reddit Research to Content Pipeline

This workflow shows how to use reddit-market-research to find pain points
and turn them into content for Twitter/LinkedIn.

## Overview

1. Identify your niche and target subreddits
2. Search for pain point signals
3. Analyze and summarize findings
4. Create content based on real problems
5. Post to social platforms

## Step-by-Step

### 1. Choose Your Subreddits

Find subreddits where your target audience hangs out:
- r/startups, r/SaaS for B2B software
- r/webdev, r/programming for developer tools
- r/productivity for productivity apps

### 2. Search for Pain Points

```bash
# Search for frustration signals
reddit search -s "startups+SaaS" \
  -k "frustrated,looking for,wish there was,hate that" \
  --time month \
  --limit 50 \
  --format json \
  -o findings.json
```

### 3. Analyze Findings

Review the JSON output for common themes:
- What problems appear multiple times?
- What solutions are people asking for?
- What existing tools are criticized?

### 4. Create Content

Use findings to create authentic content:
- Address real pain points you discovered
- Use the language people actually use
- Provide genuine value/solutions

### 5. Post

```bash
# Twitter thread
twitter thread \
  "I spent an hour reading Reddit posts about [topic]..." \
  "The #1 complaint: [pain point]" \
  "Here's what actually helps: [solution]"

# LinkedIn summary
linkedin post "After researching [topic] on Reddit, here are the top 3 pain points..."
```

## With Claude Code

Single prompt approach:
```
Search Reddit in r/startups and r/SaaS for posts about CRM frustrations
from the last month. Summarize the top 5 pain points and draft a Twitter
thread addressing them with practical solutions.
```

## Tips

- Search weekly to stay current
- Track which topics get engagement
- Don't just parrot complaints—add value
```

---

### Workflow 2: Keyword Research → Content Planning

**File:** `docs/workflows/keyword-research.md`

```markdown
# Keyword Research for Content Planning

Use autocomplete-cli to discover what people are searching for and
plan content around proven demand.

## Overview

1. Start with seed keywords
2. Expand across search engines
3. Identify content opportunities
4. Plan content calendar

## Step-by-Step

### 1. Seed Keywords

Start with broad topics in your niche:
- "productivity app"
- "project management"
- "time tracking"

### 2. Expand with Autocomplete

```bash
# Google suggestions with a-z expansion
autocomplete google "productivity app" --expand --format json -o google.json

# YouTube (different intent)
autocomplete youtube "productivity tips" --expand --format json -o youtube.json

# Amazon (product-focused)
autocomplete amazon "productivity" --format json -o amazon.json
```

### 3. Analyze Patterns

Look for:
- Questions (how to, why does, what is)
- Comparisons (X vs Y, best X for Y)
- Problems (X not working, X alternative)

### 4. Prioritize

Focus on keywords that:
- Match your expertise
- Have clear content format (blog, video, thread)
- Aren't saturated with big players

### 5. Create Content Calendar

Map keywords to content types:
| Keyword | Content Type | Platform |
|---------|--------------|----------|
| "productivity app for ADHD" | Twitter thread | Twitter |
| "how to stay focused" | Blog post | neonwatty.com |
| "pomodoro vs time blocking" | LinkedIn post | LinkedIn |

## With Claude Code

```
Search for autocomplete suggestions for "developer productivity" across
Google and YouTube. Identify the top 10 content opportunities and
suggest what type of content would work best for each.
```
```

---

### Workflow 3: Cross-Platform Posting

**File:** `docs/workflows/cross-posting.md`

```markdown
# Cross-Platform Posting Strategy

How to adapt and post content across Twitter, LinkedIn, and YouTube.

## Platform Differences

| Platform | Tone | Format | Best For |
|----------|------|--------|----------|
| Twitter | Casual, punchy | Threads, single tweets | Hot takes, engagement |
| LinkedIn | Professional | Longer posts, stories | Thought leadership |
| YouTube | Educational | Shorts, tutorials | How-to content |

## Workflow

### 1. Create Core Content

Start with your main idea—typically the longest form:
- Blog post
- Detailed thread
- Video script

### 2. Adapt for Each Platform

**Twitter version:**
- Punchy, direct
- Use line breaks
- End with engagement hook

**LinkedIn version:**
- More context/story
- Professional framing
- Softer CTA

### 3. Post Sequentially

```bash
# Twitter first (fastest feedback)
twitter thread \
  "Hot take: [opinion]" \
  "[Supporting point 1]" \
  "[Supporting point 2]" \
  "Agree or disagree?"

# LinkedIn (adapted version)
linkedin post "I've been thinking about [topic]...

[Story/context]

Here's what I've learned:
1. [Point 1]
2. [Point 2]
3. [Point 3]

What's your experience with this?"
```

### 4. Track & Iterate

- Note which version performs better
- Adjust future content based on feedback
- Don't just copy-paste between platforms

## With Claude Code

```
I have this Twitter thread: [paste thread]

Rewrite it for LinkedIn with a more professional tone and story-driven
hook. Keep the core points but adapt the style.
```
```

---

### Workflow 4: YouTube Shorts Management

**File:** `docs/workflows/youtube-shorts.md`

```markdown
# YouTube Shorts Workflow

Managing YouTube Shorts uploads with youtube-cli.

## Workflow

### 1. Prepare Video

- Vertical format (9:16)
- Under 60 seconds
- Clear thumbnail moment

### 2. Upload

```bash
youtube upload video.mp4 \
  --title "Quick tip: [topic]" \
  --description "Full video: [link]" \
  --tags "shorts,tips,productivity"
```

### 3. Monitor Performance

```bash
# List recent uploads
youtube list --max 10
```

### 4. Clone Successful Formats

```bash
# Clone video with new title for A/B testing
youtube clone <video-id> --title "Alternate title"
```

## Tips

- Upload at consistent times
- Test different thumbnails via titles
- Link to long-form content
```

---

## File Structure

```
docs/
├── workflows/
│   ├── README.md              # Overview of workflows
│   ├── reddit-to-content.md   # Research → Content
│   ├── keyword-research.md    # Autocomplete → Planning
│   ├── cross-posting.md       # Multi-platform posting
│   └── youtube-shorts.md      # YouTube management
└── ... (existing docs)
```

---

## Workflows README

**File:** `docs/workflows/README.md`

```markdown
# Workflows

These guides show how to combine Social Starter Pack tools for common use cases.

## Available Workflows

| Workflow | Tools Used | Description |
|----------|------------|-------------|
| [Reddit to Content](./reddit-to-content.md) | reddit-market-research, twitter-cli, linkedin-cli | Turn Reddit research into social posts |
| [Keyword Research](./keyword-research.md) | autocomplete-cli | Plan content around search demand |
| [Cross-Platform Posting](./cross-posting.md) | twitter-cli, linkedin-cli | Adapt content for each platform |
| [YouTube Shorts](./youtube-shorts.md) | youtube-cli | Manage Shorts uploads |

## Claude Code Integration

All workflows can be accelerated with Claude Code + MCP. See each guide
for example prompts.

## Suggest a Workflow

Have a workflow you'd like documented? Open an issue!
```

---

## Implementation Priority

1. **reddit-to-content.md** - Demonstrates unique value
2. **cross-posting.md** - Common use case
3. **keyword-research.md** - Useful standalone
4. **youtube-shorts.md** - Simpler, lower priority

---

## Estimated Effort

- reddit-to-content.md: 45 minutes
- keyword-research.md: 30 minutes
- cross-posting.md: 30 minutes
- youtube-shorts.md: 20 minutes
- workflows/README.md: 15 minutes

Total: ~2.5 hours

---

## Status

- [ ] docs/workflows/ directory created
- [ ] workflows/README.md written
- [ ] reddit-to-content.md written
- [ ] keyword-research.md written
- [ ] cross-posting.md written
- [ ] youtube-shorts.md written
- [ ] Main docs/README.md updated to link to workflows
