# Plan: Workflow Tutorial Blog Post

**Title:** "From Reddit Research to Twitter Thread: A Claude Code Workflow"

**Goal:** Show the tools working together in a real end-to-end workflow, demonstrating the "full loop" value proposition.

**Target Platforms:** neonwatty.com (primary), cross-post to dev.to

---

## Outline

### 1. Introduction
- The promise: Research → Create → Distribute in one session
- Why CLI tools + AI assistants are powerful together
- What we'll build: A Twitter thread based on Reddit research

### 2. The Scenario
- You're writing content about [example niche: developer productivity]
- Goal: Find real pain points, create authentic content
- Time: Under 30 minutes from research to published thread

### 3. Step 1: Keyword Discovery
```bash
# Find what people are searching for
autocomplete google "developer productivity" --expand
autocomplete youtube "productivity tips for developers"
```

**Output example:**
- developer productivity tools
- developer productivity tips
- developer productivity hacks
- etc.

**Insight:** Pick 2-3 angles that resonate

### 4. Step 2: Reddit Research
```bash
# Find real pain points
reddit search -s "productivity+programming" -k "struggling with,can't focus,distracted" --time month --limit 30
```

**Analysis:**
- Show example findings (anonymized)
- Common themes that emerge
- Direct quotes that could inspire content

### 5. Step 3: Content Creation (with Claude Code)
Using MCP or just feeding findings to Claude:

**Prompt example:**
```
Based on these Reddit findings about developer productivity struggles:
[paste key findings]

Write a 5-tweet thread that:
- Acknowledges the problem authentically
- Shares 3 actionable tips
- Ends with engagement hook
```

**Show the generated thread**

### 6. Step 4: Publish
```bash
# Post to Twitter
twitter thread \
  "Thread: Why developers lose 2+ hours daily to context switching..." \
  "1/ The problem isn't discipline. It's environment design..." \
  "2/ Here's what actually works..." \
  "3/ The one tool that changed everything for me..." \
  "What's your biggest productivity killer? 👇"

# Cross-post summary to LinkedIn
linkedin post "I analyzed 30 Reddit posts about developer productivity. Here's what I learned..."
```

### 7. Full MCP Workflow Alternative
Show how this can be done conversationally with Claude Code + MCP:

**Single prompt approach:**
```
Search Reddit for developer productivity pain points,
analyze the top themes, write a Twitter thread addressing
the main issues, and post it.
```

**Claude Code executes:**
1. Calls reddit-market-research
2. Analyzes findings
3. Generates thread
4. Calls twitter-cli to post

### 8. Results & Iteration
- How to track engagement
- Using feedback for next iteration
- Building a content calendar with this workflow

### 9. Tips for Success
- Quality over speed: Review AI output before posting
- Add your voice: Don't just post AI-generated content verbatim
- Engage with responses: The thread is just the start

### 10. Try It Yourself
- Link to repo
- Quick start instructions
- Encourage sharing their results

---

## Code Blocks Summary

```bash
# 1. Keyword research
autocomplete google "your niche" --expand

# 2. Reddit research
reddit search -s "relevant+subreddits" -k "pain point keywords" --time month

# 3. Post thread
twitter thread "Tweet 1" "Tweet 2" "Tweet 3"

# 4. Cross-post
linkedin post "Summary for LinkedIn audience"
```

---

## Assets Needed

- [ ] Workflow diagram (4 steps with arrows)
- [ ] Screenshot of autocomplete output
- [ ] Screenshot of Reddit search results
- [ ] Screenshot of posted Twitter thread
- [ ] Screenshot of LinkedIn post
- [ ] (Optional) Screen recording of full workflow

---

## Real Example to Use

Pick a real niche and actually do the workflow:
- Run the commands
- Capture real output
- Post a real thread (can delete after screenshots)
- This adds authenticity

**Suggested niches:**
- Developer productivity
- Indie hacking challenges
- Remote work struggles
- Learning to code

---

## SEO Keywords

- Claude Code workflow
- Reddit to Twitter pipeline
- Content research automation
- Social media workflow
- AI content creation workflow

---

## Cross-Promotion

- Link to overview post (tool introductions)
- Link to MCP deep dive (technical details)
- Link to "CLI is All You Need" (philosophy)
- Embed the actual Twitter thread in the post

---

## Differentiation

This post is unique because:
- Shows tools working together, not in isolation
- Real workflow with real output
- Demonstrates AI + CLI synergy
- Practical, not theoretical

---

## Estimated Effort

- Actually running the workflow: 1 hour
- Writing the post: 2 hours
- Screenshots and diagram: 1 hour
- Editing: 30 minutes

---

## Status

- [ ] Run real workflow, capture outputs
- [ ] Draft written
- [ ] Assets created
- [ ] Published to neonwatty.com
- [ ] Cross-posted to dev.to
- [ ] Shared on Twitter/LinkedIn (meta: share the thread about making threads)
