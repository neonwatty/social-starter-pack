import { homedir } from 'os'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import type { SchedulerConfig } from './types.js'

const CONFIG_DIR = path.join(homedir(), '.config', 'social-scheduler')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

export function getConfig(): SchedulerConfig | null {
  // First check environment variables
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const owner = process.env.SCHEDULER_REPO_OWNER
  const repo = process.env.SCHEDULER_REPO_NAME

  if (token && owner && repo) {
    return { token, owner, repo }
  }

  // Fall back to config file
  if (!existsSync(CONFIG_FILE)) {
    return null
  }

  try {
    const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
    if (data.token && data.owner && data.repo) {
      return data as SchedulerConfig
    }
    return null
  } catch {
    return null
  }
}

export function saveConfig(config: SchedulerConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, '{}')
  }
}

export function requireConfig(): SchedulerConfig {
  const config = getConfig()
  if (!config) {
    console.error('Not configured. Run: scheduler config --token <token> --owner <owner> --repo <repo>')
    console.error('Or set environment variables: GITHUB_TOKEN, SCHEDULER_REPO_OWNER, SCHEDULER_REPO_NAME')
    process.exit(1)
  }
  return config
}
