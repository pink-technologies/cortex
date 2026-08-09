// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import type { ExecutionJobHandler } from './execution-job-handler'
import { type ExecutionJobProcessingResult } from '../jobs/processing'
import {
  ExecutionJobHandlerAlreadyRegisteredError,
  ExecutionJobHandlerNotFoundError,
} from './error/error'

/**
 * Injection token for the execution-job handlers available to the Node.
 */
export const EXECUTION_JOB_HANDLERS = Symbol('EXECUTION_JOB_HANDLERS')

/**
 * Stores and resolves execution-job handlers by their supported job kind.
 *
 * The registry is created during Node startup and remains immutable after
 * construction. Duplicate job kinds fail during bootstrap so routing conflicts
 * cannot reach job processing.
 */
@Injectable()
export class ExecutionJobHandlerRegistry {
  // MARK: - Private Properties

  private readonly handlers: ReadonlyMap<string, ExecutionJobHandler<ExecutionJobProcessingResult>>

  // MARK: - Constructor

  /**
   * Creates an execution-job handler registry.
   *
   * @param handlers - Handlers available to the current Node.
   * @throws {@link ExecutionJobHandlerAlreadyRegisteredError} When multiple
   *   handlers declare the same job kind.
   */
  constructor(
    @Inject(EXECUTION_JOB_HANDLERS)
    handlers: readonly ExecutionJobHandler<ExecutionJobProcessingResult>[],
  ) {
    this.handlers = this.createHandlersByKind(handlers)
  }

  // MARK: - Instance Methods

  /**
   * Resolves the handler registered for a job kind.
   *
   * @param kind - Job kind to resolve.
   * @returns The handler registered for the provided kind.
   * @throws {@link ExecutionJobHandlerNotFoundError} When no handler supports
   *   the provided kind.
   */
  resolve(kind: string): ExecutionJobHandler<ExecutionJobProcessingResult> {
    const handler = this.handlers.get(kind)

    if (!handler) {
      throw new ExecutionJobHandlerNotFoundError(kind)
    }

    return handler
  }

  /**
   * Returns the job kinds supported by the current Node.
   *
   * The returned array is a snapshot and follows handler registration order.
   *
   * @returns Registered execution-job kinds.
   */
  supportedKinds(): readonly string[] {
    return [...this.handlers.keys()]
  }

  // MARK: - Private methods

  private createHandlersByKind(
    handlers: readonly ExecutionJobHandler<ExecutionJobProcessingResult>[],
  ): ReadonlyMap<string, ExecutionJobHandler<ExecutionJobProcessingResult>> {
    const handlersByKind = new Map<string, ExecutionJobHandler<ExecutionJobProcessingResult>>()

    for (const handler of handlers) {
      if (handlersByKind.has(handler.kind)) {
        throw new ExecutionJobHandlerAlreadyRegisteredError(handler.kind)
      }

      handlersByKind.set(handler.kind, handler)
    }

    return handlersByKind
  }
}
