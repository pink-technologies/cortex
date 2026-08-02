// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ServiceUnavailableException, UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { WorkflowOperatorGuard } from '../../src/workflow/guard'

/**
 * Creates a guard backed by a config stub returning the given token.
 */
function guardWithConfiguredToken(token: string | undefined): WorkflowOperatorGuard {
  const configService = {
    get: jest.fn().mockReturnValue(token),
  } as unknown as ConfigService

  return new WorkflowOperatorGuard(configService)
}

/**
 * Creates an execution-context stub carrying the given authorization header.
 */
function contextWithAuthorization(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization === undefined ? {} : { authorization },
      }),
    }),
  } as unknown as ExecutionContext
}

describe('WorkflowOperatorGuard', () => {
  it('rejects with 503 when no operator token is configured', () => {
    const guard = guardWithConfiguredToken(undefined)

    expect(() => guard.canActivate(contextWithAuthorization('Bearer anything'))).toThrow(
      ServiceUnavailableException,
    )
  })

  it('rejects with 503 when the configured token is blank', () => {
    const guard = guardWithConfiguredToken('   ')

    expect(() => guard.canActivate(contextWithAuthorization('Bearer anything'))).toThrow(
      ServiceUnavailableException,
    )
  })

  it('rejects with 401 when the authorization header is missing', () => {
    const guard = guardWithConfiguredToken('operator-token')

    expect(() => guard.canActivate(contextWithAuthorization())).toThrow(UnauthorizedException)
  })

  it('rejects with 401 when the scheme is not Bearer', () => {
    const guard = guardWithConfiguredToken('operator-token')

    expect(() => guard.canActivate(contextWithAuthorization('Basic operator-token'))).toThrow(
      UnauthorizedException,
    )
  })

  it('rejects with 401 when the token does not match', () => {
    const guard = guardWithConfiguredToken('operator-token')

    expect(() => guard.canActivate(contextWithAuthorization('Bearer wrong-token'))).toThrow(
      UnauthorizedException,
    )
  })

  it('allows the request when the token matches', () => {
    const guard = guardWithConfiguredToken('operator-token')

    expect(guard.canActivate(contextWithAuthorization('Bearer operator-token'))).toBe(true)
  })
})
