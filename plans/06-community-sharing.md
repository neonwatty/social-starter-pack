# Plan: Community Sharing Strategy

**Goal:** Share the toolkit across relevant communities to drive awareness, stars, and adoption.

---

## Platform Strategy

### Tier 1: Primary Targets

#### Reddit: r/ClaudeAI
**Why:** Direct audience interested in Claude Code tooling
**Timing:** Post when MCP deep dive blog post is ready
**Format:** Discussion post, not link drop

```markdown
Title: I built a social media CLI toolkit with MCP integration for Claude Code

Hey everyone,

I've been using Claude Code heavily for content creation and wanted to share
a toolkit I built to support my workflow.

**What it includes:**
- autocomplete-cli: Keyword research from 5 search engines
- reddit-market-research: Search Reddit for pain points
- twitter-cli: Post tweets and threads
- linkedin-cli: Post to LinkedIn
- youtube-cli: Manage YouTube Shorts
- MCP server: Use all tools via Claude Code

**The MCP integration** is what makes it powerful—I can say "search Reddit for
complaints about X, summarize them, and draft a tweet" and Claude handles it.

Blog post with details: [link]
GitHub: [link]

Would love feedback, especially on the MCP server implementation. Anyone else
building custom MCP tools?
```

#### Reddit: r/SideProject
**Why:** Indie hackers appreciate tool-building stories
**Format:** "Built this for myself" angle

```markdown
Title: Built a CLI toolkit for my content workflow - ended up using it daily

After spending too many hours manually posting content across platforms,
I built a set of CLI tools to automate the boring parts.

Started with just Twitter, then added LinkedIn, YouTube, and research tools.
Now I use it with Claude Code and it's become central to my workflow.

**Tools:**
- Keyword research (Google, YouTube, Amazon autocomplete)
- Reddit market research
- Post to Twitter/LinkedIn
- YouTube Shorts management

Open source: [link]

Anyone else building tools for their own workflow?
```

#### Hacker News
**Why:** Dev tool launches can do well; quality-focused audience
**Timing:** Post on weekday morning (US time)
**Format:** Show HN

```markdown
Title: Show HN: Social Starter Pack – CLI tools for content creation with Claude Code

I built a collection of CLI tools for social media content creation:
keyword research, Reddit market research, posting to Twitter/LinkedIn/YouTube.

What makes it different: designed specifically to work with AI coding assistants.
There's an MCP server that lets Claude Code use all the tools via natural language.

Example workflow: "Search Reddit for pain points about X, summarize findings,
and post a thread to Twitter."

GitHub: [link]
```

**HN Tips:**
- Don't oversell
- Be ready to answer technical questions
- Engage with comments quickly
- Post around 8-10am EST Tuesday-Thursday

---

### Tier 2: Secondary Targets

#### Reddit: r/webdev
**Angle:** demo-recorder (when ready) and developer tooling
**Wait until:** demo-recorder is polished

#### Reddit: r/startups
**Angle:** reddit-market-research specifically

```markdown
Title: I built a CLI tool to automate Reddit market research

Finding pain points on Reddit manually is time-consuming. Built a CLI tool
that lets me search across subreddits with specific keywords and export results.

Example: `reddit search -s "startups+SaaS" -k "looking for,need help" --format csv`

Part of a larger toolkit, but this one's been most useful for idea validation.

GitHub: [link]
```

#### Reddit: r/LocalLLaMA
**Angle:** MCP server architecture and local tool building

#### dev.to
**Format:** Cross-post blog articles with dev.to canonical URL pointing to neonwatty.com
**Tags:** #claude #cli #productivity #opensource

---

### Tier 3: Personal Networks

#### Twitter/X
**Format:** Thread announcing the toolkit

```
Thread idea:

1/ I've been building CLI tools for my content workflow. Finally packaged them up as open source.

2/ The toolkit includes:
- Keyword research (5 search engines)
- Reddit market research
- Twitter posting
- LinkedIn posting
- YouTube Shorts management

3/ The killer feature: an MCP server that lets Claude Code use all the tools via natural language.

4/ Example prompt: "Search Reddit for complaints about developer tools, summarize the top pain points, and draft a Twitter thread about solutions."

5/ Claude handles the research, analysis, AND posting. I just review and approve.

6/ It's all open source: [link]

Blog post with details: [link]

7/ What tools would you add to something like this? Bluesky? Mastodon? Something else?
```

#### LinkedIn
**Format:** Professional announcement post

```
Excited to share something I've been working on:

A collection of CLI tools for content creators who want to automate the
tedious parts of social media.

Why CLI tools? They work beautifully with AI coding assistants like Claude Code.
Instead of clicking through UIs, you describe what you want and the AI handles it.

The toolkit includes research tools (keyword suggestions, Reddit market research)
and posting tools (Twitter, LinkedIn, YouTube).

Open source and free to use: [link]

If you're building content workflows with AI assistants, I'd love to hear
what's working for you.
```

---

## Timing & Sequencing

| Week | Action |
|------|--------|
| 1 | Publish overview blog post |
| 1 | Update README with improvements |
| 1 | Share on Twitter/LinkedIn (personal) |
| 2 | Post to r/ClaudeAI |
| 2 | Publish MCP deep dive blog post |
| 2 | Post to r/SideProject |
| 3 | Submit to Hacker News (Show HN) |
| 3 | Cross-post to dev.to |
| 4 | Post to r/startups (reddit-market-research angle) |
| 4+ | Respond to feedback, iterate |

---

## Engagement Strategy

### Response Templates

**For "Why not just use X?":**
```
Good question! [X] is great for [use case]. This toolkit focuses on [different angle].
The main difference is [key differentiator]. If [X] works for you, stick with it!
```

**For feature requests:**
```
Interesting idea! That could be a good addition. Want to open an issue on GitHub?
Would love to see how you'd use it.
```

**For technical questions:**
```
[Direct answer]. There's more detail in the [docs/blog post]. Happy to elaborate
if that doesn't cover it!
```

### Metrics to Track

- GitHub stars (track daily for first 2 weeks)
- npm download counts
- Blog post traffic (by referrer)
- Reddit post upvotes and comment count
- Twitter engagement

---

## Don't Do List

- ❌ Don't spam multiple subreddits on the same day
- ❌ Don't use clickbait titles
- ❌ Don't ignore negative feedback
- ❌ Don't just drop links—provide value
- ❌ Don't post on Reddit weekends (lower engagement)

---

## Post-Launch

After initial sharing:
1. Monitor feedback and issues
2. Write follow-up posts based on questions
3. Consider Product Hunt launch (bigger effort, save for later)
4. Look for podcast/interview opportunities

---

## Status Tracker

| Platform | Content Ready | Posted | Engagement |
|----------|---------------|--------|------------|
| Twitter thread | [ ] | [ ] | - |
| LinkedIn post | [ ] | [ ] | - |
| r/ClaudeAI | [ ] | [ ] | - |
| r/SideProject | [ ] | [ ] | - |
| Hacker News | [ ] | [ ] | - |
| dev.to | [ ] | [ ] | - |
| r/startups | [ ] | [ ] | - |
