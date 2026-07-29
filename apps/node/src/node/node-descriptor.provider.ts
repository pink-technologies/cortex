// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import type { NodeDescriptor } from './node-descriptor'

/**
 * Produces the workload-matching descriptor advertised by this Cortex node.
 *
 * The provider centralizes the node's supported capabilities, labels, and job
 * kinds so registration and execution flows use the same metadata. Dynamic
 * machine attributes, such as the operating system and CPU architecture, are
 * resolved when the descriptor is created.
 */
@Injectable()
export class NodeDescriptorProvider {
  
  // MARK: - Instance methods

  /**
   * Creates the immutable metadata advertised by this Cortex node.
   *
   * @returns A descriptor containing the operating system, architecture,
   * capabilities, labels, and supported execution-job kinds.
   */
  create(): NodeDescriptor {
    return {
      architecture: this.resolveArchitecture(),
      capabilities: [
        'os.macos',
      ],
      labels: [],      
      operatingSystem: this.resolveOperatingSystem(),
      supportedKinds: [
        'system.test',
      ],
    }
  }

  // MARK: - Private methods

  private resolveArchitecture(): NodeArchitecture {
    switch (process.arch) {
      case 'arm64':
        return NodeArchitecture.ARM64

      case 'x64':
        return NodeArchitecture.X64

      default:
        throw new Error(
          `Unsupported node architecture: ${process.arch}`,
        )
    }
  }

  private resolveOperatingSystem(): NodeOperatingSystem {
    switch (process.platform) {
      case 'darwin':
        return NodeOperatingSystem.MACOS

      case 'linux':
        return NodeOperatingSystem.LINUX

      case 'win32':
        return NodeOperatingSystem.WINDOWS

      default:
        throw new Error(
          `Unsupported node operating system: ${process.platform}`,
        )
    }
  }
}