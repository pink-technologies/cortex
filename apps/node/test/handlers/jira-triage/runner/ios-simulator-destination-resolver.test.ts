// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}))

import { execFile } from 'node:child_process'
import {
  commandNeedsIosSimulatorDestination,
  IosSimulatorDestinationNotFoundError,
  IosSimulatorDestinationResolver,
  parseSimctlDevices,
  rewriteIosSimulatorDestination,
  selectIosSimulatorDevice,
} from '../../../../src/handlers/jira-triage/runner/ios-simulator-destination-resolver'

describe('selectIosSimulatorDevice', () => {
  it('prefers a booted iPhone over earlier shutdown devices', () => {
    const selected = selectIosSimulatorDevice([
      {
        name: 'iPhone 17 Pro',
        state: 'Shutdown',
        udid: 'shutdown-1',
      },
      {
        name: 'iPhone 17e',
        state: 'Booted',
        udid: 'booted-1',
      },
      {
        name: 'iPad Pro',
        state: 'Booted',
        udid: 'ipad-booted',
      },
    ])

    expect(selected).toEqual({
      name: 'iPhone 17e',
      state: 'Booted',
      udid: 'booted-1',
    })
  })

  it('falls back to the first available iPhone when none are booted', () => {
    const selected = selectIosSimulatorDevice([
      {
        isAvailable: false,
        name: 'iPhone 16',
        state: 'Shutdown',
        udid: 'unavailable',
      },
      {
        name: 'iPhone 17e',
        state: 'Shutdown',
        udid: 'first-available',
      },
      {
        name: 'iPhone 17 Pro',
        state: 'Shutdown',
        udid: 'second',
      },
    ])

    expect(selected?.udid).toBe('first-available')
  })

  it('returns undefined when no iPhone devices are usable', () => {
    expect(
      selectIosSimulatorDevice([
        {
          name: 'iPad Air',
          state: 'Booted',
          udid: 'ipad',
        },
      ]),
    ).toBeUndefined()
  })
})

describe('parseSimctlDevices', () => {
  it('flattens runtime-grouped devices', () => {
    const devices = parseSimctlDevices(
      JSON.stringify({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.iOS-26-4': [
            {
              name: 'iPhone 17e',
              state: 'Shutdown',
              udid: 'a',
            },
          ],
          'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
            {
              name: 'iPhone SE (3rd generation)',
              state: 'Shutdown',
              udid: 'b',
            },
          ],
        },
      }),
    )

    expect(devices).toHaveLength(2)
    expect(devices.map((device) => device.udid)).toEqual(['a', 'b'])
  })
})

describe('commandNeedsIosSimulatorDestination / rewriteIosSimulatorDestination', () => {
  it('detects xcodebuild test commands even without a destination', () => {
    expect(
      commandNeedsIosSimulatorDestination(
        'xcodebuild test -scheme TruvideoSdk -destination "platform=iOS Simulator,name=iPhone 16"',
      ),
    ).toBe(true)
    expect(
      commandNeedsIosSimulatorDestination('xcodebuild test -scheme TruvideoSdk'),
    ).toBe(true)
    expect(commandNeedsIosSimulatorDestination('npm test')).toBe(false)
    expect(
      commandNeedsIosSimulatorDestination(
        'xcodebuild build -scheme DI -destination "generic/platform=iOS Simulator"',
      ),
    ).toBe(false)
  })

  it('rewrites quoted destinations and appends when missing', () => {
    expect(
      rewriteIosSimulatorDestination(
        'xcodegen generate && xcodebuild test -scheme TruvideoSdk -destination "platform=iOS Simulator,name=iPhone 16" SWIFTSCOPE_PATHS=',
        'platform=iOS Simulator,id=ABC',
      ),
    ).toBe(
      'xcodegen generate && xcodebuild test -scheme TruvideoSdk -destination "platform=iOS Simulator,id=ABC" SWIFTSCOPE_PATHS=',
    )

    expect(
      rewriteIosSimulatorDestination(
        "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16'",
        'platform=iOS Simulator,id=ABC',
      ),
    ).toBe("xcodebuild test -destination 'platform=iOS Simulator,id=ABC'")

    expect(
      rewriteIosSimulatorDestination(
        'xcodegen generate && xcodebuild test -scheme TruvideoSdk SWIFTSCOPE_PATHS=',
        'platform=iOS Simulator,id=ABC',
      ),
    ).toBe(
      'xcodegen generate && xcodebuild test -scheme TruvideoSdk SWIFTSCOPE_PATHS= -destination "platform=iOS Simulator,id=ABC"',
    )
  })
})

describe('IosSimulatorDestinationResolver', () => {
  const execFileMock = execFile as unknown as jest.Mock
  const resolver = new IosSimulatorDestinationResolver()

  beforeEach(() => {
    execFileMock.mockReset()
  })

  it('resolves a booted iPhone from simctl JSON', async () => {
    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(
        null,
        JSON.stringify({
          devices: {
            runtime: [
              {
                name: 'iPhone 17 Pro',
                state: 'Shutdown',
                udid: 'shutdown',
              },
              {
                name: 'iPhone 17e',
                state: 'Booted',
                udid: 'booted-udid',
              },
            ],
          },
        }),
        '',
      )
    })

    await expect(resolver.resolve(new AbortController().signal)).resolves.toEqual({
      destination: 'platform=iOS Simulator,id=booted-udid',
      id: 'booted-udid',
      name: 'iPhone 17e',
    })
  })

  it('throws when no iPhone simulator is available', async () => {
    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, JSON.stringify({ devices: { runtime: [] } }), '')
    })

    await expect(resolver.resolve(new AbortController().signal)).rejects.toBeInstanceOf(
      IosSimulatorDestinationNotFoundError,
    )
  })
})
