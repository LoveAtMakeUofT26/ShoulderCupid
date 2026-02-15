import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let loaded = false

/**
 * Load environment variables for the backend in a monorepo-friendly way.
 *
 * We support a repo-root `.env` (per README) even when the backend is started
 * with `cwd=apps/backend` (e.g. `npm run backend`).
 *
 * Load order:
 * 1) repo root `.env` (if present)
 * 2) `apps/backend/.env` (if present) to allow package-local overrides
 *
 * Note: dotenv does not override existing `process.env` by default, which is
 * what we want for production environments where vars are injected externally.
 */
export function loadEnv(): void {
  if (loaded) return
  loaded = true

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename) // apps/backend/src/config

  const repoRootEnv = path.resolve(__dirname, '../../../..', '.env')
  const backendEnv = path.resolve(__dirname, '../..', '.env') // apps/backend/.env

  if (fs.existsSync(repoRootEnv)) {
    dotenv.config({ path: repoRootEnv })
  }
  if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv })
  }
}

