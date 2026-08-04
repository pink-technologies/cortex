// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind } from '@cortex/protocol'
import { validateExecutionJobResult } from '@/execution/contracts/execution-job-result-contracts'
import { ExecutionJobResultInvalidError } from '@/execution/error/error'

describe('validateExecutionJobResult', () => {
  it('parses a result for a contract-bearing kind', () => {
    const result = validateExecutionJobResult(AgentExecuteJobKind, {
      executionId: 'exec-1',
      iterationCount: 2,
      output: 'Done.',
      usage: {
        inputTokens: 10,
        outputTokens: 4,
        totalTokens: 14,
      },
    })

    expect(result).toMatchObject({
      executionId: 'exec-1',
      output: 'Done.',
    })
  })

  it('throws a typed error when the result violates the kind contract', () => {
    expect(() => validateExecutionJobResult(AgentExecuteJobKind, { output: 42 })).toThrow(
      ExecutionJobResultInvalidError,
    )

    try {
      validateExecutionJobResult(AgentExecuteJobKind, { output: 42 })
    } catch (error) {
      expect(error).toBeInstanceOf(ExecutionJobResultInvalidError)
      expect((error as ExecutionJobResultInvalidError).code).toBe('EXECUTION_JOB_RESULT_INVALID')
      expect((error as ExecutionJobResultInvalidError).cause).toBeDefined()
    }
  })

  it('passes results through unchanged for kinds without a registered contract', () => {
    const opaque = { anything: true }

    expect(validateExecutionJobResult('system.test', opaque)).toBe(opaque)
  })
})
