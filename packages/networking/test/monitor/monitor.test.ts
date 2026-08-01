// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NoopMonitor } from '../../src/monitor/monitor'

describe('NoopMonitor', () => {
  it('accepts lifecycle calls without throwing', () => {
    const monitor = new NoopMonitor()
    monitor.requestDidStart()
    monitor.requestDidComplete()
    monitor.requestDidFail()
  })
})
