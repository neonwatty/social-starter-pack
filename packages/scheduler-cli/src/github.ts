import { Octokit } from '@octokit/rest'
import type { Post, PostFolder, SchedulerConfig } from './types.js'

function getOctokit(config: SchedulerConfig): Octokit {
  return new Octokit({ auth: config.token })
}

function getPath(folder: PostFolder, id: string): string {
  return `posts/${folder}/${id}.json`
}

export async function createPost(
  config: SchedulerConfig,
  post: Post,
  folder: PostFolder
): Promise<{ id: string; path: string }> {
  const octokit = getOctokit(config)
  const filePath = getPath(folder, post.id)

  // Create or update the file
  await octokit.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
    message: `${post.status === 'draft' ? 'Create draft' : 'Schedule post'}: ${post.id}`,
    content: Buffer.from(JSON.stringify(post, null, 2)).toString('base64'),
  })

  return { id: post.id, path: filePath }
}

// Alias for backwards compatibility
export async function createScheduledPost(
  config: SchedulerConfig,
  post: Post
): Promise<{ id: string; path: string }> {
  return createPost(config, post, 'scheduled')
}

export async function createDraftPost(
  config: SchedulerConfig,
  post: Post
): Promise<{ id: string; path: string }> {
  return createPost(config, post, 'drafts')
}

export async function listPosts(
  config: SchedulerConfig,
  folder: PostFolder
): Promise<Post[]> {
  const octokit = getOctokit(config)

  try {
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: `posts/${folder}`,
    })

    if (!Array.isArray(data)) {
      return []
    }

    const posts: Post[] = []

    for (const file of data) {
      if (file.type === 'file' && file.name.endsWith('.json')) {
        try {
          const { data: fileData } = await octokit.repos.getContent({
            owner: config.owner,
            repo: config.repo,
            path: file.path,
          })

          if ('content' in fileData && typeof fileData.content === 'string') {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
            posts.push(JSON.parse(content) as Post)
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    // Sort by date (scheduled date for scheduled, updated date for drafts)
    posts.sort((a, b) => {
      if (folder === 'scheduled') {
        if (!a.scheduledAt) return 1
        if (!b.scheduledAt) return -1
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return posts
  } catch (error) {
    // Folder doesn't exist or other error
    if ((error as { status?: number }).status === 404) {
      return []
    }
    throw error
  }
}

// Convenience functions
export async function listScheduledPosts(config: SchedulerConfig): Promise<Post[]> {
  return listPosts(config, 'scheduled')
}

export async function listDraftPosts(config: SchedulerConfig): Promise<Post[]> {
  return listPosts(config, 'drafts')
}

export async function listAllPosts(config: SchedulerConfig): Promise<Post[]> {
  const [drafts, scheduled, published] = await Promise.all([
    listPosts(config, 'drafts'),
    listPosts(config, 'scheduled'),
    listPosts(config, 'published'),
  ])
  return [...drafts, ...scheduled, ...published]
}

export async function getPost(
  config: SchedulerConfig,
  id: string,
  folder: PostFolder = 'scheduled'
): Promise<Post | null> {
  const octokit = getOctokit(config)
  const filePath = getPath(folder, id)

  try {
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
    })

    if ('content' in data && typeof data.content === 'string') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8')
      return JSON.parse(content) as Post
    }

    return null
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return null
    }
    throw error
  }
}

export async function deletePost(
  config: SchedulerConfig,
  id: string,
  folder: PostFolder
): Promise<boolean> {
  const octokit = getOctokit(config)
  const filePath = getPath(folder, id)

  try {
    // Get the file first to get its SHA
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
    })

    if (!('sha' in data)) {
      return false
    }

    // Delete the file
    await octokit.repos.deleteFile({
      owner: config.owner,
      repo: config.repo,
      path: filePath,
      message: `Delete ${folder.slice(0, -1)}: ${id}`,
      sha: data.sha,
    })

    return true
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return false
    }
    throw error
  }
}

// Try to delete from any folder
export async function deletePostAny(
  config: SchedulerConfig,
  id: string
): Promise<boolean> {
  for (const folder of ['drafts', 'scheduled', 'published'] as PostFolder[]) {
    const deleted = await deletePost(config, id, folder)
    if (deleted) return true
  }
  return false
}

// Alias for backwards compatibility
export async function cancelScheduledPost(
  config: SchedulerConfig,
  id: string
): Promise<boolean> {
  return deletePost(config, id, 'scheduled')
}

export async function updatePost(
  config: SchedulerConfig,
  post: Post,
  folder: PostFolder
): Promise<void> {
  const octokit = getOctokit(config)
  const filePath = getPath(folder, post.id)

  // Get current file to get SHA
  const { data } = await octokit.repos.getContent({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
  })

  if (!('sha' in data)) {
    throw new Error('File not found')
  }

  await octokit.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path: filePath,
    message: `Update post: ${post.id}`,
    content: Buffer.from(JSON.stringify(post, null, 2)).toString('base64'),
    sha: data.sha,
  })
}
