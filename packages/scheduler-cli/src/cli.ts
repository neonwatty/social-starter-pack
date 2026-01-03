#!/usr/bin/env node

import { getConfig, saveConfig, clearConfig, requireConfig } from './config.js'
import {
  createScheduledPost,
  createDraftPost,
  listScheduledPosts,
  listDraftPosts,
  listAllPosts,
  deletePostAny,
  getPost,
} from './github.js'
import type { Post, Platform, PostFolder } from './types.js'

interface ParsedArgs {
  command: string
  positional: string[]
  flags: Record<string, string | boolean>
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: '',
    positional: [],
    flags: {},
  }

  let i = 0

  if (args.length > 0 && !args[0].startsWith('-')) {
    result.command = args[0]
    i = 1
  }

  while (i < args.length) {
    const arg = args[i]

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const nextArg = args[i + 1]

      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[key] = nextArg
        i += 2
      } else {
        result.flags[key] = true
        i += 1
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1)
      const nextArg = args[i + 1]

      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[key] = nextArg
        i += 2
      } else {
        result.flags[key] = true
        i += 1
      }
    } else {
      result.positional.push(arg)
      i += 1
    }
  }

  return result
}

function printHelp(): void {
  console.log(`
Scheduler CLI - Schedule social media posts via GitHub

USAGE:
  scheduler <command> [options]

COMMANDS:
  config                  Configure GitHub repo settings
  draft                   Create a draft post
  schedule                Create a scheduled post
  list                    List posts (drafts, scheduled, or all)
  get <id>                Get a post by ID
  delete <id>             Delete a post by ID
  status                  Show configuration status
  help                    Show this help message

CONFIG OPTIONS:
  --token <token>         GitHub personal access token
  --owner <owner>         Repository owner (username or org)
  --repo <repo>           Repository name

DRAFT/SCHEDULE OPTIONS:
  --text <text>           Post content text (required)
  --platforms <p1,p2>     Comma-separated: twitter,linkedin,reddit (required)
  --at <datetime>         Schedule time (ISO 8601 or "YYYY-MM-DD HH:mm") - for schedule only
  --media <url1,url2>     Comma-separated media URLs (images/videos) - for Twitter
  --subreddit <name>      For Reddit: subreddit name
  --title <title>         For Reddit: post title
  --visibility <v>        For LinkedIn: public or connections
  --flair <text>          For Reddit: flair text

LIST OPTIONS:
  --status <status>       Filter: drafts, scheduled, published, all (default: all)
  --json                  Output as JSON
  --limit <n>             Limit number of results

EXAMPLES:
  # Configure
  scheduler config --token ghp_xxx --owner myuser --repo social-scheduler

  # Create a draft
  scheduler draft --text "Working on this..." --platforms twitter

  # Schedule a Twitter post
  scheduler schedule --text "Hello world!" --platforms twitter --at "2024-12-25 10:00"

  # Schedule multi-platform post
  scheduler schedule --text "Big announcement!" --platforms twitter,linkedin --at "2024-12-25 10:00"

  # Schedule Reddit post
  scheduler schedule --text "Check this out" --platforms reddit --subreddit programming --title "My Project" --at "2024-12-25 10:00"

  # List posts
  scheduler list                      # All posts
  scheduler list --status drafts      # Only drafts
  scheduler list --status scheduled   # Only scheduled
  scheduler list --json               # JSON output

  # Manage posts
  scheduler get abc123
  scheduler delete abc123
`)
}

function handleConfig(args: ParsedArgs): void {
  const token = args.flags['token'] as string | undefined
  const owner = args.flags['owner'] as string | undefined
  const repo = args.flags['repo'] as string | undefined

  if (!token && !owner && !repo) {
    const config = getConfig()
    if (config) {
      console.log('\nCurrent configuration:')
      console.log(`  Owner: ${config.owner}`)
      console.log(`  Repo:  ${config.repo}`)
      console.log(`  Token: ${config.token.slice(0, 8)}...`)
      console.log('')
    } else {
      console.log('Not configured. Use: scheduler config --token <t> --owner <o> --repo <r>')
    }
    return
  }

  if (!token || !owner || !repo) {
    console.error('Error: --token, --owner, and --repo are all required')
    process.exit(1)
  }

  saveConfig({ token, owner, repo })
  console.log('Configuration saved.')
}

function handleStatus(): void {
  const config = getConfig()
  console.log('\nScheduler Status:')
  if (config) {
    console.log(`  Configured: Yes`)
    console.log(`  Repository: ${config.owner}/${config.repo}`)
    console.log(`  Token:      ${config.token.slice(0, 8)}...`)
  } else {
    console.log('  Configured: No')
    console.log('  Run "scheduler config" to set up')
  }
  console.log('')
}

function buildPost(args: ParsedArgs, isDraft: boolean): Post {
  const text = args.flags['text'] as string | undefined
  const platformsStr = args.flags['platforms'] as string | undefined
  const at = args.flags['at'] as string | undefined
  const subreddit = args.flags['subreddit'] as string | undefined
  const title = args.flags['title'] as string | undefined
  const visibility = (args.flags['visibility'] as string) || 'public'
  const flair = args.flags['flair'] as string | undefined
  const mediaStr = args.flags['media'] as string | undefined

  if (!text) {
    console.error('Error: --text is required')
    process.exit(1)
  }

  if (!platformsStr) {
    console.error('Error: --platforms is required (twitter,linkedin,reddit)')
    process.exit(1)
  }

  if (!isDraft && !at) {
    console.error('Error: --at is required for scheduling (ISO 8601 datetime)')
    process.exit(1)
  }

  const platforms = platformsStr.split(',').map(p => p.trim().toLowerCase()) as Platform[]
  const validPlatforms = ['twitter', 'linkedin', 'reddit']
  for (const p of platforms) {
    if (!validPlatforms.includes(p)) {
      console.error(`Error: Invalid platform "${p}". Use: ${validPlatforms.join(', ')}`)
      process.exit(1)
    }
  }

  // Validate Reddit requirements for scheduled posts
  if (platforms.includes('reddit') && !isDraft) {
    if (!subreddit) {
      console.error('Error: --subreddit is required for Reddit posts')
      process.exit(1)
    }
    if (!title) {
      console.error('Error: --title is required for Reddit posts')
      process.exit(1)
    }
  }

  // Parse datetime if scheduling
  let scheduledAt: string | null = null
  if (at) {
    try {
      const date = new Date(at)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }
      scheduledAt = date.toISOString()
    } catch {
      console.error('Error: Invalid datetime format. Use ISO 8601 or "YYYY-MM-DD HH:mm"')
      process.exit(1)
    }
  }

  const now = new Date().toISOString()
  const post: Post = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    scheduledAt,
    status: isDraft ? 'draft' : 'scheduled',
    platforms,
    content: {},
  }

  // Parse media URLs if provided
  const mediaUrls = mediaStr ? mediaStr.split(',').map(url => url.trim()).filter(url => url.length > 0) : undefined

  // Build content per platform
  if (platforms.includes('twitter')) {
    post.content.twitter = { text, ...(mediaUrls && { mediaUrls }) }
  }
  if (platforms.includes('linkedin')) {
    post.content.linkedin = {
      text,
      visibility: visibility === 'connections' ? 'connections' : 'public',
    }
  }
  if (platforms.includes('reddit')) {
    post.content.reddit = {
      subreddit: subreddit || '',
      title: title || '',
      body: text,
      ...(flair && { flairText: flair }),
    }
  }

  return post
}

async function handleDraft(args: ParsedArgs): Promise<void> {
  const config = requireConfig()
  const post = buildPost(args, true)

  try {
    const result = await createDraftPost(config, post)
    console.log(`\nDraft created successfully!`)
    console.log(`  ID:        ${result.id}`)
    console.log(`  Platforms: ${post.platforms.join(', ')}`)
    console.log(`  Path:      ${result.path}`)
    console.log('')

    if (args.flags['json']) {
      console.log(JSON.stringify(post, null, 2))
    }
  } catch (error) {
    console.error('Failed to create draft:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function handleSchedule(args: ParsedArgs): Promise<void> {
  const config = requireConfig()
  const post = buildPost(args, false)

  try {
    const result = await createScheduledPost(config, post)
    console.log(`\nPost scheduled successfully!`)
    console.log(`  ID:        ${result.id}`)
    console.log(`  Platforms: ${post.platforms.join(', ')}`)
    console.log(`  Scheduled: ${new Date(post.scheduledAt!).toLocaleString()}`)
    console.log(`  Path:      ${result.path}`)
    console.log('')

    if (args.flags['json']) {
      console.log(JSON.stringify(post, null, 2))
    }
  } catch (error) {
    console.error('Failed to schedule post:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function handleList(args: ParsedArgs): Promise<void> {
  const config = requireConfig()
  const statusFilter = args.flags['status'] as string | undefined

  try {
    let posts: Post[]

    if (statusFilter === 'drafts') {
      posts = await listDraftPosts(config)
    } else if (statusFilter === 'scheduled') {
      posts = await listScheduledPosts(config)
    } else {
      posts = await listAllPosts(config)
    }

    const limit = args.flags['limit']
    if (limit && typeof limit === 'string') {
      posts = posts.slice(0, parseInt(limit, 10))
    }

    if (args.flags['json']) {
      console.log(JSON.stringify(posts, null, 2))
      return
    }

    if (posts.length === 0) {
      const statusLabel = statusFilter ? statusFilter : 'posts'
      console.log(`\nNo ${statusLabel} found.\n`)
      return
    }

    const title = statusFilter
      ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} (${posts.length})`
      : `All Posts (${posts.length})`
    console.log(`\n${title}:\n`)

    for (const post of posts) {
      const preview = getPreviewText(post).slice(0, 50)
      const platforms = post.platforms.join(', ')
      const statusBadge = post.status.toUpperCase()

      console.log(`  ${post.id.slice(0, 8)}... [${statusBadge}]`)
      console.log(`    Platforms: ${platforms}`)
      if (post.status === 'scheduled' && post.scheduledAt) {
        console.log(`    Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`)
      } else if (post.status === 'draft') {
        console.log(`    Updated:   ${new Date(post.updatedAt).toLocaleString()}`)
      }
      console.log(`    Preview:   ${preview}${preview.length >= 50 ? '...' : ''}`)
      console.log('')
    }
  } catch (error) {
    console.error('Failed to list posts:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function handleGet(args: ParsedArgs): Promise<void> {
  const config = requireConfig()
  const id = args.positional[0]

  if (!id) {
    console.error('Error: Post ID is required')
    console.error('Usage: scheduler get <id>')
    process.exit(1)
  }

  try {
    // Try all folders
    let post: Post | null = null
    for (const folder of ['drafts', 'scheduled', 'published'] as PostFolder[]) {
      post = await getPost(config, id, folder)
      if (post) break
    }

    if (!post) {
      console.error(`Post ${id} not found.`)
      process.exit(1)
    }

    if (args.flags['json']) {
      console.log(JSON.stringify(post, null, 2))
      return
    }

    console.log(`\nPost: ${post.id}`)
    console.log(`  Status:    ${post.status}`)
    console.log(`  Platforms: ${post.platforms.join(', ')}`)
    console.log(`  Created:   ${new Date(post.createdAt).toLocaleString()}`)
    console.log(`  Updated:   ${new Date(post.updatedAt).toLocaleString()}`)
    if (post.scheduledAt) {
      console.log(`  Scheduled: ${new Date(post.scheduledAt).toLocaleString()}`)
    }
    console.log(`  Content:`)
    console.log(`    ${getPreviewText(post)}`)
    console.log('')
  } catch (error) {
    console.error('Failed to get post:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

async function handleDelete(args: ParsedArgs): Promise<void> {
  const config = requireConfig()
  const id = args.positional[0]

  if (!id) {
    console.error('Error: Post ID is required')
    console.error('Usage: scheduler delete <id>')
    process.exit(1)
  }

  try {
    const success = await deletePostAny(config, id)
    if (success) {
      console.log(`Post ${id} deleted successfully.`)
    } else {
      console.error(`Post ${id} not found.`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Failed to delete post:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function getPreviewText(post: Post): string {
  if (post.content.twitter?.text) return post.content.twitter.text
  if (post.content.linkedin?.text) return post.content.linkedin.text
  if (post.content.reddit?.body) return post.content.reddit.body
  if (post.content.reddit?.title) return post.content.reddit.title
  return ''
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (args.command === '' || args.command === 'help' || args.flags['help'] || args.flags['h']) {
    printHelp()
    return
  }

  switch (args.command) {
    case 'config':
      handleConfig(args)
      break

    case 'status':
      handleStatus()
      break

    case 'draft':
      await handleDraft(args)
      break

    case 'schedule':
      await handleSchedule(args)
      break

    case 'list':
      await handleList(args)
      break

    case 'get':
      await handleGet(args)
      break

    case 'delete':
    case 'cancel': // alias for backwards compat
      await handleDelete(args)
      break

    case 'logout':
      clearConfig()
      console.log('Configuration cleared.')
      break

    default:
      console.error(`Unknown command: ${args.command}`)
      console.error("Run 'scheduler help' for usage.")
      process.exit(1)
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
