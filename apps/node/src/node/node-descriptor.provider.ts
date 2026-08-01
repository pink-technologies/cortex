// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import { ExecutionJobHandlerRegistry } from '../execution/handler'
import type { NodeDescriptor } from './models'

/**
 * Produces the workload-matching descriptor advertised by this Cortex node.
 *
 * The provider centralizes the node's supported capabilities, labels, and job
 * kinds so registration and execution flows use the same metadata. Supported
 * job kinds are derived from the execution-job handler registry, so the node
 * only advertises work it can actually process. Dynamic machine attributes,
 * such as the operating system and CPU architecture, are resolved when the
 * descriptor is created.
 */
@Injectable()
export class NodeDescriptorProvider {
  // MARK: - Constructor

  /**
   * Creates a node-descriptor provider.
   *
   * @param executionJobHandlerRegistry - Registry whose registered handlers
   * define the job kinds this node advertises.
   */
  constructor(
    private readonly executionJobHandlerRegistry: ExecutionJobHandlerRegistry,
  ) {}

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
      supportedKinds: [...this.executionJobHandlerRegistry.supportedKinds()],
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