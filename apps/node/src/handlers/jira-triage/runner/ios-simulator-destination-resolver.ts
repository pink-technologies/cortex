// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { execFile } from 'node:child_process'
import { NodeApplicationError } from '../../../error/error'

/**
 * Concrete iOS Simulator destination resolved for suite execution.
 */
export type ResolvedIosSimulatorDestination = {
  /**
   * xcodebuild `-destination` value using a stable simulator UDID.
   *
   * Example: `platform=iOS Simulator,id=EC8E6F0C-EED8-49E2-8DDC-2B6E56112B1E`
   */
  readonly destination: string

  /**
   * Simulator UDID.
   */
  readonly id: string

  /**
   * Human-readable simulator name (for example `iPhone 17e`).
   */
  readonly name: string
}

/**
 * One device entry from `xcrun simctl list devices … -j`.
 */
export type SimctlDevice = {
  /**
   * Whether the device can be used. Missing means available when listed under
   * the `available` filter.
   */
  readonly isAvailable?: boolean

  /**
   * Display name of the simulator.
   */
  readonly name: string

  /**
   * Boot state such as `Booted` or `Shutdown`.
   */
  readonly state: string

  /**
   * Stable simulator identifier.
   */
  readonly udid: string
}

/**
 * Thrown when this Node has no usable iPhone iOS Simulator for suite runs.
 */
export class IosSimulatorDestinationNotFoundError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for missing-simulator failures.
   */
  readonly code = 'IOS_SIMULATOR_DESTINATION_NOT_FOUND'

  // MARK: - Constructor

  /**
   * Creates an error describing that no iPhone simulator was available.
   *
   * @param options - Optional underlying `cause`.
   */
  constructor(options?: ErrorOptions) {
    super(
      'No available iPhone iOS Simulator was found on this Node for xcodebuild test.',
      options,
    )
  }
}

/**
 * Resolves a concrete iPhone iOS Simulator destination for allowlisted suites.
 *
 * Selection policy:
 * 1. Prefer a booted available iPhone simulator
 * 2. Otherwise the first available iPhone simulator from
 *    `xcrun simctl list devices available -j`
 */
@Injectable()
export class IosSimulatorDestinationResolver {
  // MARK: - Instance methods

  /**
   * Resolves one iPhone simulator destination for the current Node.
   *
   * @param signal - Cooperative cancellation for the simctl listing process.
   * @returns Destination suitable for xcodebuild `-destination`.
   * @throws {@link IosSimulatorDestinationNotFoundError} when no iPhone
   *   simulator is available.
   */
  async resolve(signal: AbortSignal): Promise<ResolvedIosSimulatorDestination> {
    signal.throwIfAborted()

    const stdout = await this.listAvailableDevicesJson(signal)
    const devices = parseSimctlDevices(stdout)
    const selected = selectIosSimulatorDevice(devices)

    if (!selected) {
      throw new IosSimulatorDestinationNotFoundError()
    }

    return {
      destination: `platform=iOS Simulator,id=${selected.udid}`,
      id: selected.udid,
      name: selected.name,
    }
  }

  // MARK: - Private methods

  private listAvailableDevicesJson(signal: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        'xcrun',
        ['simctl', 'list', 'devices', 'available', '-j'],
        {
          maxBuffer: 4 * 1024 * 1024,
          signal,
          timeout: 30_000,
        },
        (error, stdout) => {
          if (error) {
            reject(error)
            return
          }

          resolve(typeof stdout === 'string' ? stdout : '')
        },
      )
    })
  }
}

/**
 * Parses device entries from `simctl list … -j` stdout.
 *
 * Exported for unit tests.
 */
export function parseSimctlDevices(stdout: string): readonly SimctlDevice[] {
  const parsed = JSON.parse(stdout) as {
    readonly devices?: Record<string, readonly SimctlDevice[]>
  }

  const devices: SimctlDevice[] = []

  for (const runtimeDevices of Object.values(parsed.devices ?? {})) {
    for (const device of runtimeDevices) {
      devices.push(device)
    }
  }

  return devices
}

/**
 * Picks a booted iPhone when present, otherwise the first available iPhone.
 *
 * Exported for unit tests.
 */
export function selectIosSimulatorDevice(
  devices: readonly SimctlDevice[],
): SimctlDevice | undefined {
  const iphones = devices.filter((device) => {
    if (!device.name.startsWith('iPhone')) {
      return false
    }

    if (device.isAvailable === false) {
      return false
    }

    return typeof device.udid === 'string' && device.udid.length > 0
  })

  return (
    iphones.find((device) => device.state === 'Booted') ??
    iphones[0]
  )
}

/**
 * Returns whether a suite command should receive a resolved iOS Simulator
 * destination.
 *
 * True when the command runs `xcodebuild test`, or already has an
 * `-destination` targeting an iOS Simulator (so a hard-coded device name can
 * be replaced).
 *
 * Exported for unit tests and {@link TestRunner}.
 */
export function commandNeedsIosSimulatorDestination(command: string): boolean {
  if (!/\bxcodebuild\b/i.test(command)) {
    return false
  }

  // `test` as its own CLI argument (not a substring of another token).
  if (/(?:^|[\s;|&])test(?:[\s;|&]|$)/i.test(command)) {
    return true
  }

  const destination = extractDestinationValue(command)
  if (!destination || !/iOS\s+Simulator/i.test(destination)) {
    return false
  }

  // Leave generic build destinations alone.
  return !/generic\/platform/i.test(destination)
}

/**
 * Applies a resolved iOS Simulator destination to a suite command.
 *
 * Replaces an existing `-destination` argument when present; otherwise appends
 * one so suite config does not need a hard-coded device name.
 *
 * Exported for unit tests and {@link TestRunner}.
 *
 * @param command - Allowlisted suite shell command.
 * @param destination - Resolved `platform=iOS Simulator,id=…` value.
 * @returns Command with the destination applied.
 */
export function rewriteIosSimulatorDestination(
  command: string,
  destination: string,
): string {
  const match = command.match(DESTINATION_ARGUMENT_PATTERN)
  if (!match || match.index === undefined) {
    return `${command} -destination "${destination}"`
  }

  const quote = match[2] !== undefined ? "'" : '"'
  const replacement = `-destination ${quote}${destination}${quote}`

  return (
    command.slice(0, match.index) +
    replacement +
    command.slice(match.index + match[0].length)
  )
}

const DESTINATION_ARGUMENT_PATTERN =
  /-destination\s+(?:"([^"]+)"|'([^']+)'|(\S+))/i

function extractDestinationValue(command: string): string | undefined {
  const match = command.match(DESTINATION_ARGUMENT_PATTERN)
  if (!match) {
    return undefined
  }

  return match[1] ?? match[2] ?? match[3]
}
