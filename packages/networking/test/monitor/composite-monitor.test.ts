// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingConnectionError } from '../../src/error/error'
import { CompositeMonitor } from '../../src/monitor/composite-monitor'
import type { Monitor } from '../../src/monitor/monitor'
import { createURLRequest } from '../support/url-request'

describe('CompositeMonitor', () => {
  it('forwards events and swallows child errors', () => {
    const calls: string[] = []
    const good: Monitor = {
      requestDidStart: () => calls.push('start'),
      requestDidComplete: () => calls.push('complete'),
      requestDidFail: () => calls.push('fail'),
    }
    const bad: Monitor = {
      requestDidStart: () => {
        throw new Error('x')
      },
      requestDidComplete: () => {
        throw new Error('x')
      },
      requestDidFail: () => {
        throw new Error('x')
      },
    }
    const monitor = new CompositeMonitor([bad, good])
    const request = createURLRequest()
    monitor.requestDidStart(request)
    monitor.requestDidComplete(request, 200)
    monitor.requestDidFail(request, new NetworkingConnectionError('e'))
    expect(calls).toEqual(['start', 'complete', 'fail'])
  })

  it('no-ops with an empty child list', () => {
    const request = createURLRequest()
    new CompositeMonitor().requestDidStart(request)
  })
})
