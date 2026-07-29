// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import type { NodeIdentity } from './node-identity'

const NodeIdentitySchema = z
  .object({
    installationId: z.string().uuid(),
  })
  .strict()

/**
 * Stores the persistent identity of this Cortex Node installation.
 *
 * The identity is generated once and reused across application restarts.
 */
@Injectable()
export class NodeIdentityStore {
  // MARK: - Instance Methods

  /**
   * Loads the existing installation identity or creates one when the Node is
   * launched for the first time.
   *
   * @returns The persistent identity of this Cortex Node installation.
   */
  async loadOrCreate(): Promise<NodeIdentity> {
    const fileURL = this.identityFileURL()

    try {
      return await this.read(fileURL)
    } catch (error) {
      if (!this.isFileNotFoundError(error)) {
        throw error
      }
    }

    await mkdir(
      dirname(fileURL),
      {
        recursive: true,
      },
    )

    const identity: NodeIdentity = {
      installationId: randomUUID(),
    }

    try {
      await writeFile(
        fileURL,
        JSON.stringify(identity, null, 2),
        {
          encoding: 'utf8',
          flag: 'wx',
          mode: 0o600,
        },
      )

      return identity
    } catch (error) {
      if (this.isFileAlreadyExistsError(error)) {
        return this.read(fileURL)
      }

      throw error
    }
  }

  // MARK: - Private Methods

  private async read(
    fileURL: string,
  ): Promise<NodeIdentity> {
    const contents = await readFile(
      fileURL,
      'utf8',
    )

    return NodeIdentitySchema.parse(
      JSON.parse(contents),
    )
  }

  private identityFileURL(): string {
    switch (process.platform) {
      case 'darwin':
        return join(
          homedir(),
          'Library',
          'Application Support',
          'Cortex',
          'node.json',
        )

      case 'linux':
        return join(
          process.env.XDG_CONFIG_HOME ??
            join(homedir(), '.config'),
          'cortex',
          'node.json',
        )

      case 'win32':
        return join(
          process.env.APPDATA ??
            join(homedir(), 'AppData', 'Roaming'),
          'Cortex',
          'node.json',
        )

      default:
        throw new Error(
          `Unsupported node operating system: ${process.platform}`,
        )
    }
  }

  private isFileNotFoundError(
    error: unknown,
  ): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    )
  }

  private isFileAlreadyExistsError(
    error: unknown,
  ): boolean {
    return (
      error instanceof Error &&
      'code' in error &&
      error.code === 'EEXIST'
    )
  }
}