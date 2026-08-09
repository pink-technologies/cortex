// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRunStatus } from '../datatypes'
import { WorkflowStep } from './workflow-step'
import type {
  WorkflowRun as WorkflowRunPersistence,
  WorkflowStep as WorkflowStepPersistence,
} from '@/infraestructure/database'

/**
 * Prisma workflow-run row, optionally with nested steps from an `include`.
 */
type WorkflowRunPersistenceRecord = WorkflowRunPersistence & {
  readonly steps?: readonly WorkflowStepPersistence[]
}

/**
 * Domain model for a persisted workflow run.
 *
 * Owns an ordered list of {@link WorkflowStep} values. Decouples repository
 * consumers from Prisma JSON column types for `input`, `result`, and `failure`.
 */
export class WorkflowRun {
  // MARK: - Properties

  /**
   * Optional uniqueness key for concurrent runs of the same logical work.
   */
  readonly activeKey: string | null

  /**
   * Timestamp when the run completed successfully.
   */
  readonly completedAt: Date | null

  /**
   * Timestamp when the run row was first persisted.
   */
  readonly createdAt: Date

  /**
   * Registry key of the workflow definition that produced this run.
   */
  readonly definitionKey: string

  /**
   * Immutable definition revision pinned when this run was created.
   */
  readonly definitionVersion: number

  /**
   * Timestamp when the run entered a terminal failure state.
   */
  readonly failedAt: Date | null

  /**
   * Sanitized failure payload persisted for the run.
   */
  readonly failure: unknown | null

  /**
   * Stable run primary key.
   */
  readonly id: string

  /**
   * Opaque run input supplied at start.
   */
  readonly input: unknown

  /**
   * Aggregated or final result for the run, when completed.
   */
  readonly result: unknown | null

  /**
   * Timestamp when the run left `PENDING`.
   */
  readonly startedAt: Date | null

  /**
   * Current run lifecycle status.
   */
  readonly status: WorkflowRunStatus

  /**
   * Ordered steps belonging to this run (by {@link WorkflowStep.position}).
   */
  readonly steps: readonly WorkflowStep[]

  /**
   * Optional enqueue idempotency key for the whole run.
   */
  readonly triggerIdentifier: string | null

  /**
   * Timestamp when the run row was last updated.
   */
  readonly updatedAt: Date

  // MARK: - Static methods

  /**
   * Maps a database workflow-run row into a domain run.
   *
   * Included steps are sorted by `position` ascending. Missing `steps` yield an
   * empty array.
   *
   * @param record - Persisted run row, optionally with nested steps.
   * @returns Domain run ready for workflow consumers.
   */
  static from(record: WorkflowRunPersistenceRecord): WorkflowRun {
    const steps = [...(record.steps ?? [])]
      .sort((left, right) => left.position - right.position)
      .map((step) => WorkflowStep.from(step))

    return new WorkflowRun(
      record.id,
      record.definitionKey,
      record.definitionVersion,
      record.status as WorkflowRunStatus,
      record.input,
      steps,
      record.createdAt,
      record.updatedAt,
      record.triggerIdentifier,
      record.activeKey,
      record.result,
      record.failure,
      record.startedAt,
      record.completedAt,
      record.failedAt,
    )
  }

  // MARK: - Constructor

  /**
   * Creates a domain workflow run.
   *
   * @param id - Stable run primary key.
   * @param definitionKey - Registry key of the workflow definition.
   * @param definitionVersion - Immutable definition revision pinned at start.
   * @param status - Current run lifecycle status.
   * @param input - Opaque run input supplied at start.
   * @param steps - Ordered steps belonging to this run.
   * @param createdAt - Timestamp when the run row was first persisted.
   * @param updatedAt - Timestamp when the run row was last updated.
   * @param triggerIdentifier - Optional enqueue idempotency key.
   * @param activeKey - Optional uniqueness key for concurrent runs.
   * @param result - Aggregated or final result when completed.
   * @param failure - Sanitized failure payload when failed.
   * @param startedAt - Timestamp when the run left `PENDING`.
   * @param completedAt - Timestamp when the run completed successfully.
   * @param failedAt - Timestamp when the run entered a terminal failure state.
   */
  constructor(
    id: string,
    definitionKey: string,
    definitionVersion: number,
    status: WorkflowRunStatus,
    input: unknown,
    steps: readonly WorkflowStep[],
    createdAt: Date,
    updatedAt: Date,
    triggerIdentifier: string | null = null,
    activeKey: string | null = null,
    result: unknown | null = null,
    failure: unknown | null = null,
    startedAt: Date | null = null,
    completedAt: Date | null = null,
    failedAt: Date | null = null,
  ) {
    this.id = id
    this.definitionKey = definitionKey
    this.definitionVersion = definitionVersion
    this.status = status
    this.input = input
    this.steps = steps
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.triggerIdentifier = triggerIdentifier
    this.activeKey = activeKey
    this.result = result
    this.failure = failure
    this.startedAt = startedAt
    this.completedAt = completedAt
    this.failedAt = failedAt
  }
}
