// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  KernelAgentNotFoundError,
  KernelEmptyResponseError,
  KernelInvalidDecisionTypeError,
  KernelMaximumIterationsError,
  KernelTimeoutError,
  KernelToolNotAllowedError,
  KernelUnexpectedStopReasonError,
  SkillDecisionTypeNotSupportedError,
} from '../../src/kernel/error/error'

describe('Kernel errors', () => {
  describe('Given KernelAgentNotFoundError', () => {
    it('Then exposes a stable agent-not-found code', () => {
      const error = new KernelAgentNotFoundError()

      expect(error).toBeInstanceOf(Error)
      expect(error.code).toBe('KERNEL_AGENT_NOT_FOUND')
    })
  })

  describe('Given KernelEmptyResponseError', () => {
    it('Then uses the default message when none is provided', () => {
      const error = new KernelEmptyResponseError()

      expect(error.code).toBe('KERNEL_EMPTY_RESPONSE')
      expect(error.message).toBe('The kernel received an empty agent response.')
    })

    it('Then preserves a custom message', () => {
      const error = new KernelEmptyResponseError('Custom empty response.')

      expect(error.message).toBe('Custom empty response.')
    })
  })

  describe('Given KernelInvalidDecisionTypeError', () => {
    it('Then includes the unrecognized decision type', () => {
      const error = new KernelInvalidDecisionTypeError('delegate')

      expect(error.code).toBe('INVALID_DECISION_TYPE')
      expect(error.message).toBe('Invalid decision type: delegate')
    })
  })

  describe('Given KernelMaximumIterationsError', () => {
    it('Then includes the exceeded iteration budget', () => {
      const error = new KernelMaximumIterationsError(3)

      expect(error.code).toBe('KERNEL_MAXIMUM_ITERATIONS')
      expect(error.message).toBe('Maximum iterations exceeded: 3')
    })
  })

  describe('Given KernelTimeoutError', () => {
    it('Then includes the timeout budget', () => {
      const error = new KernelTimeoutError(1_000)

      expect(error.code).toBe('KERNEL_TIMEOUT')
      expect(error.message).toBe('Execution timed out after 1000ms')
    })
  })

  describe('Given KernelToolNotAllowedError', () => {
    it('Then retains the tool name and tool-use id', () => {
      const error = new KernelToolNotAllowedError('test.add', 'tool-use-1')

      expect(error.code).toBe('KERNEL_TOOL_NOT_ALLOWED')
      expect(error.toolName).toBe('test.add')
      expect(error.toolUseId).toBe('tool-use-1')
      expect(error.message).toBe('Tool not allowed: test.add')
    })
  })

  describe('Given KernelUnexpectedStopReasonError', () => {
    it('Then retains the stop reason and explanation', () => {
      const error = new KernelUnexpectedStopReasonError(
        'content_filtered',
        'The agent did not complete the execution.',
      )

      expect(error.code).toBe('KERNEL_UNEXPECTED_STOP_REASON')
      expect(error.stopReason).toBe('content_filtered')
      expect(error.explanation).toBe('The agent did not complete the execution.')
      expect(error.message).toBe(
        'The agent did not complete the execution. (stop reason: content_filtered)',
      )
    })
  })

  describe('Given SkillDecisionTypeNotSupportedError', () => {
    it('Then exposes a stable unsupported-skill code', () => {
      const error = new SkillDecisionTypeNotSupportedError()

      expect(error.code).toBe('SKILL_DECISION_TYPE_NOT_SUPPORTED')
    })
  })
})
