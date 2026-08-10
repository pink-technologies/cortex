// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

/**
 * Loads dotenv files into {@link process.env}, overwriting existing keys.
 *
 * Node's {@link process.loadEnvFile} skips keys already present in the
 * environment, which lets stale shell exports mask local `.env` values.
 *
 * Loads repo-root `.env` first (when present), then `apps/node/.env`, so
 * Node-local values win on key conflicts.
 *
 * @param cwd - Working directory used to resolve `.env` paths; defaults to
 * {@link process.cwd}.
 * @param environment - Env map to mutate; defaults to {@link process.env}.
 */
export function loadNodeEnvFiles(
  cwd: string = process.cwd(),
  environment: NodeJS.ProcessEnv = process.env,
): void {
  const envCandidates = [resolve(cwd, '.env'), resolve(cwd, 'apps/node/.env')]

  for (const envPath of envCandidates) {
    if (!existsSync(envPath)) {
      continue
    }

    const parsed = parseEnv(readFileSync(envPath, 'utf8'))

    for (const [key, value] of Object.entries(parsed)) {
      environment[key] = value
    }
  }
}
