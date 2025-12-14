# Plan: Tool Spotlight Blog Posts

**Goal:** Individual deep-dive posts for tools with interesting stories or unique value propositions.

**Note:** demo-recorder is excluded as it's not ready yet. Will be added when ready.

---

## Post A: autocomplete-cli

**Title:** "5 Search Engines for Keyword Research in One CLI"

### Outline

1. **The Problem**
   - Keyword research tools are expensive (Ahrefs, SEMrush)
   - Free alternatives require browser juggling
   - No good CLI option for automation

2. **The Solution**
   - One CLI, five engines: Google, YouTube, Bing, Amazon, DuckDuckGo
   - Expansion mode (a-z) for comprehensive results
   - Multiple output formats (text, JSON, CSV)

3. **Use Cases**
   - Content ideation for blogs
   - YouTube video topic research
   - Amazon product research
   - SEO keyword discovery

4. **Examples**
   ```bash
   # Basic Google suggestions
   autocomplete google "how to"

   # YouTube with expansion
   autocomplete youtube "python tutorial" --expand

   # Amazon product research
   autocomplete amazon "wireless headphones" --format json

   # Compare across engines
   autocomplete all "best laptop" --format csv
   ```

5. **Integration with Claude Code**
   - Example prompt: "Find keyword ideas for a blog post about X"
   - How it feeds into content creation workflow

6. **Technical Details**
   - How autocomplete APIs work
   - Rate limiting considerations
   - Caching strategy

### Assets
- [ ] Screenshot of terminal output
- [ ] Comparison table of engines
- [ ] Example JSON output

### SEO Keywords
- Keyword research CLI
- Google autocomplete API
- Free keyword research tool
- YouTube keyword research

---

## Post B: reddit-market-research

**Title:** "Finding Pain Points on Reddit: Automated Market Research"

### Outline

1. **The Problem**
   - Reddit is a goldmine for market research
   - Manual searching is time-consuming
   - Hard to track and export findings

2. **Why Reddit?**
   - Authentic user complaints and requests
   - Subreddits as niche communities
   - Historical data available

3. **The Tool**
   - Search across subreddits
   - Filter by keywords, time, score
   - Export to JSON/CSV
   - Post and flair support

4. **Search Strategy**
   - Keywords that indicate pain: "looking for", "need help", "frustrated", "wish there was"
   - Subreddit selection for your niche
   - Time filtering for recency

5. **Examples**
   ```bash
   # Find startup pain points
   reddit search -s "startups+SaaS" -k "looking for,need help"

   # Recent complaints in webdev
   reddit search -s "webdev" -k "bug,broken" --time week

   # Export for analysis
   reddit search -s "productivity" -k "wish there was" --format csv -o results.csv
   ```

6. **Real Findings**
   - Share anonymized examples of insights found
   - How these led to content/product ideas

7. **Integration with Claude Code**
   - Example: "Search Reddit for complaints about email clients, summarize the top pain points"

### Assets
- [ ] Screenshot of search results
- [ ] Example CSV output
- [ ] Workflow diagram: Reddit → Analysis → Content

### SEO Keywords
- Reddit market research
- Reddit API search
- Pain point discovery
- Market research automation

---

## Post C: twitter-cli

**Title:** "Twitter API v2 from the Command Line: A Developer's Guide"

### Outline

1. **The Problem**
   - Twitter web UI is distracting
   - Scheduling tools are expensive
   - API access is powerful but complex

2. **The Solution**
   - Simple CLI for common operations
   - Thread posting support
   - Media uploads
   - Timeline viewing

3. **Setup**
   - Getting API v2 credentials
   - OAuth 1.0a user context
   - First-time auth flow

4. **Examples**
   ```bash
   # Simple tweet
   twitter post "Hello world!"

   # Tweet with image
   twitter post "Check this out!" --image screenshot.png

   # Post a thread
   twitter thread "First tweet" "Second tweet" "Third tweet"

   # Reply to a tweet
   twitter reply <tweet-id> "Great point!"

   # View timeline
   twitter timeline --limit 20
   ```

5. **Rate Limiting**
   - Understanding Twitter's rate limits
   - How the CLI handles them
   - Best practices

6. **Integration with Claude Code**
   - Example: "Post about my latest blog post with an engaging hook"
   - Generating thread content with AI

### Assets
- [ ] Screenshot of thread posting
- [ ] API credential setup walkthrough
- [ ] Rate limit table

### SEO Keywords
- Twitter CLI tool
- Twitter API v2 tutorial
- Post tweet from command line
- Twitter thread automation

---

## Post D: linkedin-cli

**Title:** "LinkedIn Posting from the Command Line"

### Outline

1. **The Problem**
   - LinkedIn's posting UI is clunky
   - No good automation tools
   - Marketing API is complex

2. **The Solution**
   - Simple post command
   - Image and video support
   - Token management built-in

3. **Setup**
   - Creating a LinkedIn app
   - OAuth 2.0 flow
   - Required permissions

4. **Examples**
   ```bash
   # Text post
   linkedin post "Excited to share..."

   # Post with image
   linkedin post "Check out this chart" --image chart.png

   # Check auth status
   linkedin status
   linkedin whoami
   ```

5. **LinkedIn-Specific Considerations**
   - Content formatting differences from Twitter
   - Image size recommendations
   - Posting frequency best practices

6. **Integration with Claude Code**
   - Example: "Rewrite this tweet for LinkedIn's professional tone"
   - Cross-posting workflow

### Assets
- [ ] Screenshot of LinkedIn post created via CLI
- [ ] App creation walkthrough
- [ ] Format comparison: Twitter vs LinkedIn

### SEO Keywords
- LinkedIn CLI tool
- LinkedIn API posting
- LinkedIn Marketing API tutorial
- Automate LinkedIn posts

---

## Post E: google-forms-cli

**Title:** "Managing Google Forms from the Command Line"

### Outline

1. **The Problem**
   - Google Forms UI is slow
   - No bulk operations
   - Hard to version control forms

2. **The Solution**
   - CRUD operations for forms
   - 8 question types supported
   - Import/export for version control

3. **Examples**
   ```bash
   # Create a form
   gforms create "Customer Survey" --questions questions.json

   # List forms
   gforms list

   # Get responses
   gforms responses <form-id> --format csv

   # Export for backup
   gforms export <form-id> -o form-backup.json
   ```

4. **Use Cases**
   - Survey automation
   - Form templating
   - Response collection pipelines

5. **Integration with Claude Code**
   - Example: "Create a customer feedback form with 5 questions about our product"

### Assets
- [ ] Screenshot of form created via CLI
- [ ] Example questions.json structure
- [ ] Response export example

### SEO Keywords
- Google Forms CLI
- Google Forms API tutorial
- Automate Google Forms
- Google Forms command line

---

## Publication Priority

1. **reddit-market-research** - Most unique, strong SEO potential
2. **autocomplete-cli** - Broad appeal, good for traffic
3. **twitter-cli** - Popular platform, high search volume
4. **linkedin-cli** - Professional audience, cross-promote
5. **google-forms-cli** - Niche but useful

---

## Status Tracker

| Post | Draft | Assets | Published | Cross-posted |
|------|-------|--------|-----------|--------------|
| autocomplete-cli | [ ] | [ ] | [ ] | [ ] |
| reddit-market-research | [ ] | [ ] | [ ] | [ ] |
| twitter-cli | [ ] | [ ] | [ ] | [ ] |
| linkedin-cli | [ ] | [ ] | [ ] | [ ] |
| google-forms-cli | [ ] | [ ] | [ ] | [ ] |
