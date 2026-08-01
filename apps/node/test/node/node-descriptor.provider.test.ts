// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind, NodeArchitecture, NodeOperatingSystem } from '@cortex/protocol'
import { ExecutionJobHandlerRegistry, type ExecutionJobHandler } from '../../src/execution/handler'
import type { ExecutionJobProcessingResult } from '../../src/execution/jobs/processing'
import { NodeDescriptorProvider } from '../../src/node/node-descriptor.provider'

/**
 * Creates a no-op handler registered for the provided job kind.
 */
function makeHandler(kind: string): ExecutionJobHandler<ExecutionJobProcessingResult> {
  return {
    kind,
    process: jest.fn(),
  }
}

describe('NodeDescriptorProvider', () => {
  const registry = new ExecutionJobHandlerRegistry([
    makeHandler(AgentExecuteJobKind),
    makeHandler('system.test'),
  ])
  const provider = new NodeDescriptorProvider(registry)

  const originalArch = process.arch
  const originalPlatform = process.platform

  afterEach(() => {
    Object.defineProperty(process, 'arch', {
      configurable: true,
      value: originalArch,
    })
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: originalPlatform,
    })
  })

  describe('supportedKinds', () => {
    it('advertises every job kind registered with the handler registry', () => {
      const descriptor = provider.create()

      expect(descriptor.supportedKinds).toEqual([
        AgentExecuteJobKind,
        'system.test',
      ])
    })

    it('advertises no kinds when no handlers are registered', () => {
      const emptyProvider = new NodeDescriptorProvider(new ExecutionJobHandlerRegistry([]))

      expect(emptyProvider.create().supportedKinds).toEqual([])
    })
  })

  describe('create', () => {
    it('resolves arm64 architecture', () => {
      Object.defineProperty(process, 'arch', {
        configurable: true,
        value: 'arm64',
      })
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'darwin',
      })

      expect(provider.create().architecture).toBe(NodeArchitecture.ARM64)
    })

    it('resolves x64 architecture', () => {
      Object.defineProperty(process, 'arch', {
        configurable: true,
        value: 'x64',
      })
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'linux',
      })

      expect(provider.create().architecture).toBe(NodeArchitecture.X64)
    })

    it('throws for an unsupported architecture', () => {
      Object.defineProperty(process, 'arch', {
        configurable: true,
        value: 'ia32',
      })

      expect(() => provider.create()).toThrow('Unsupported node architecture: ia32')
    })

    it('resolves macos, linux, and windows operating systems', () => {
      Object.defineProperty(process, 'arch', {
        configurable: true,
        value: 'arm64',
      })

      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'darwin',
      })
      expect(provider.create().operatingSystem).toBe(NodeOperatingSystem.MACOS)

      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'linux',
      })
      expect(provider.create().operatingSystem).toBe(NodeOperatingSystem.LINUX)

      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'win32',
      })
      expect(provider.create().operatingSystem).toBe(NodeOperatingSystem.WINDOWS)
    })

    it('throws for an unsupported operating system', () => {
      Object.defineProperty(process, 'arch', {
        configurable: true,
        value: 'arm64',
      })
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'freebsd',
      })

      expect(() => provider.create()).toThrow('Unsupported node operating system: freebsd')
    })
  })
})
