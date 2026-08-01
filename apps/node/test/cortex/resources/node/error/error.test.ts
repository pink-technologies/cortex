// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CortexNodeHeartbeatError, CortexNodeRegisterError } from '../../../../../src/cortex'

describe('CortexNodeRegisterError', () => {
  it('stores code and cause', () => {
    const cause = new Error('transport')
    const error = new CortexNodeRegisterError({ cause })

    expect(error.name).toBe('CortexNodeRegisterError')
    expect(error.code).toBe('CORTEX_NODE_REGISTER_ERROR')
    expect(error.message).toContain('register')
    expect(error.cause).toBe(cause)
  })
})

describe('CortexNodeHeartbeatError', () => {
  it('stores node id, code, and cause', () => {
    const cause = new Error('transport')
    const error = new CortexNodeHeartbeatError('node-1', { cause })

    expect(error.name).toBe('CortexNodeHeartbeatError')
    expect(error.code).toBe('CORTEX_NODE_HEARTBEAT_ERROR')
    expect(error.nodeId).toBe('node-1')
    expect(error.message).toContain('node-1')
    expect(error.cause).toBe(cause)
  })
})
