// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { DatabaseTransaction } from '@/infraestructure/database'
import type { WorkflowStepStatus } from '../datatypes'

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
