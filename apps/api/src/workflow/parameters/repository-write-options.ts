// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { DatabaseTransaction } from '@/infraestructure/database'
import type { WorkflowRunStatus, WorkflowStepStatus } from '../datatypes'

/**
 * Optional write controls for workflow repository mutations.
 */
export interface RepositoryWriteOptions {
  /**
   * When set, only update a step whose status is one of these values.
   *
   * Used for optimistic advance so concurrent completes do not double-apply.
   */
  readonly onlyIfStatusIn?: readonly WorkflowStepStatus[]

  /**
   * Transaction client from {@link Database.withTransaction}.
   *
   * When omitted, the repository uses the shared database client.
   */
  readonly transaction?: DatabaseTransaction
}

/**
 * Optional write controls for workflow-run status mutations.
 */
export interface RunRepositoryWriteOptions {
  /**
   * When set, only update a run whose status is one of these values.
   *
   * Used as an optimistic guard so a concurrent terminal transition (for
   * example a completing advance racing a cancellation) cannot be overwritten.
   */
  readonly onlyIfStatusIn?: readonly WorkflowRunStatus[]

  /**
   * Transaction client from {@link Database.withTransaction}.
   *
   * When omitted, the repository uses the shared database client.
   */
  readonly transaction?: DatabaseTransaction
}
