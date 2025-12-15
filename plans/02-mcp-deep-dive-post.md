# Plan: MCP Deep Dive Blog Post

**Title:** "Building an MCP Server to Give Claude Code Social Media Powers"

**Goal:** Technical deep dive showing how to build and use MCP servers, positioned as differentiated content (few people are writing about this).

**Target Platforms:** neonwatty.com (primary), cross-post to dev.to

---

## Outline

### 1. Hook
- Claude Code is powerful, but its real strength is extensibility
- MCP (Model Context Protocol) lets you give Claude new capabilities
- I built an MCP server that connects Claude to 7 social media tools

### 2. What is MCP?
- Brief explanation of Model Context Protocol
- How it enables tool use in Claude Code
- Link to Anthropic's MCP documentation

### 3. Architecture Overview
- Diagram: Claude Code ↔ MCP Server ↔ CLI Tools
- Explain the tool registration pattern
- Show the server entry point structure

### 4. Tool Registration Deep Dive
Show actual code from the mcp-server package:

```typescript
// Example: Registering the twitter-post tool
server.tool({
  name: "twitter-post",
  description: "Post a tweet to X/Twitter",
  parameters: {
    text: { type: "string", description: "Tweet content" },
    image: { type: "string", optional: true, description: "Path to image" }
  },
  handler: async ({ text, image }) => {
    // Call twitter-cli under the hood
  }
});
```

### 5. Handling Different Tool Types
- Simple commands (autocomplete)
- Auth-required tools (twitter, linkedin)
- Multi-step operations (reddit search with filtering)
- File-handling tools (youtube upload)

### 6. Error Handling & User Experience
- How to surface errors back to Claude
- Rate limiting considerations
- Auth state management

### 7. Installation & Configuration
- `make install-mcp` workflow
- How Claude Code discovers MCP servers
- Configuration in `.claude/mcp.json`

### 8. Example Prompts & Outputs
Show real examples:
- "Post this to Twitter and LinkedIn"
- "Search Reddit for complaints about X"
- "Find keyword suggestions for Y"

### 9. Lessons Learned
- Keep tool descriptions clear and specific
- Handle auth gracefully
- Test tools individually before integrating

### 10. Building Your Own
- Encourage readers to build their own MCP tools
- Link to MCP SDK documentation
- Ideas for other tools to build

---

## Code Snippets to Include

1. Server initialization code
2. Tool registration pattern
3. Error handling wrapper
4. Example tool implementation (simplified)

---

## Assets Needed

- [ ] Architecture diagram (boxes and arrows)
- [ ] Screenshot of Claude Code using MCP tools
- [ ] Terminal output showing tool execution
- [ ] Code snippets (syntax highlighted)

---

## Technical Accuracy Checklist

- [ ] Verify code snippets match actual implementation
- [ ] Test all example prompts work as described
- [ ] Link to correct MCP documentation
- [ ] Verify installation instructions are current

---

## SEO Keywords

- MCP server Claude Code
- Model Context Protocol tutorial
- Claude Code custom tools
- Building MCP servers
- Claude Code extensibility

---

## Cross-Promotion

- Link to overview post (intro to the toolkit)
- Link to "CLI is All You Need" (philosophy)
- Link to individual tool docs in the repo

---

## Differentiation

This post is differentiated because:
- Few tutorials on building custom MCP servers exist
- Shows real production code, not toy examples
- Covers practical concerns (auth, errors, rate limits)

---

## Estimated Effort

- Writing: 3-4 hours (technical content)
- Code review/extraction: 1 hour
- Diagrams: 1 hour
- Testing examples: 30 minutes

---

## Status

- [ ] Draft written
- [ ] Code snippets verified
- [ ] Assets created
- [ ] Published to neonwatty.com
- [ ] Cross-posted to dev.to
- [ ] Shared on Twitter/LinkedIn
