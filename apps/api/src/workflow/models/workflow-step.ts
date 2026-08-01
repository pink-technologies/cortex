// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepStatus, type WorkflowStepKind } from '../datatypes'

/**
 * Persistence fields required to build a {@link WorkflowStep}.
 */
export interface WorkflowStepRecord {
  /**
   * Timestamp when the step completed successfully.
   */
  readonly completedAt: Date | null

  /**
   * Timestamp when the step row was first persisted.
   */
  readonly createdAt: Date

  /**
   * Timestamp when the step entered a terminal failure state.
   */
  readonly failedAt: Date | null

  /**
   * Stable step primary key.
   */
  readonly id: string

  /**
   * Optional step-scoped input projection.
   */
  readonly input: unknown | null

  /**
   * Handler kind when the step kind is `JOB`.
   */
  readonly jobKind: string | null

  /**
   * Stable key within the run.
   */
  readonly key: string

  /**
   * Whether this step enqueues a job or waits for human approval.
   */
  readonly kind: string

  /**
   * Optional step-scoped output produced on completion.
   */
  readonly output: unknown | null

  /**
   * Zero-based order of this step within the run.
   */
  readonly position: number

  /**
   * Owning workflow run primary key.
   */
  readonly runId: string

  /**
   * Timestamp when the step became active.
   */
  readonly startedAt: Date | null

  /**
   * Current step lifecycle status.
   */
  readonly status: string

  /**
   * Timestamp when the step row was last updated.
   */
  readonly updatedAt: Date
}

/**
 * Domain model for a single step inside a {@link WorkflowRun}.
 *
 * Decouples consumers from Prisma row shapes. Steps are ordered by
 * {@link position} within their run.
 */
export class WorkflowStep {
  // MARK: - Properties

  /**
   * Timestamp when the step completed successfully.
   */
  readonly completedAt: Date | null

  /**
   * Timestamp when the step row was first persisted.
   */
  readonly createdAt: Date

  /**
   * Timestamp when the step entered a terminal failure state.
   */
  readonly failedAt: Date | null

  /**
   * Stable step primary key.
   */
  readonly id: string

  /**
   * Optional step-scoped input projection.
   */
  readonly input: unknown | null

  /**
   * Handler kind when {@link kind} is `JOB` (for example `jira.triage`).
   */
  readonly jobKind: string | null

  /**
   * Stable key within the run (for example `triage`, `approval`).
   */
  readonly key: string

  /**
   * Whether this step enqueues a job or waits for human approval.
   */
  readonly kind: WorkflowStepKind

  /**
   * Optional step-scoped output produced on completion.
   */
  readonly output: unknown | null

  /**
   * Zero-based order of this step within the run.
   */
  readonly position: number

  /**
   * Owning workflow run primary key.
   */
  readonly runId: string

  /**
   * Timestamp when the step became active.
   */
  readonly startedAt: Date | null

  /**
   * Current step lifecycle status.
   */
  readonly status: WorkflowStepStatus

  /**
   * Timestamp when the step row was last updated.
   */
  readonly updatedAt: Date

  // MARK: - Computed Properties

  /**
   * Whether this step is in a terminal lifecycle status.
   *
   * Terminal statuses are `CANCELLED`, `COMPLETED`, `FAILED`, and `SKIPPED`.
   */
  get isTerminal(): boolean {
    return (
      this.status === WorkflowStepStatus.CANCELLED ||
      this.status === WorkflowStepStatus.COMPLETED ||
      this.status === WorkflowStepStatus.FAILED ||
      this.status === WorkflowStepStatus.SKIPPED
    )
  }

  // MARK: - Static methods

  /**
   * Maps a persistence step record into a domain step.
   *
   * @param record - Persisted step fields.
   * @returns Domain step ready for workflow consumers.
   */
  static from(record: WorkflowStepRecord): WorkflowStep {
    return new WorkflowStep(
      record.id,
      record.runId,
      record.key,
      record.position,
      record.kind as WorkflowStepKind,
      record.status as WorkflowStepStatus,
      record.jobKind,
      record.input,
      record.output,
      record.createdAt,
      record.updatedAt,
      record.startedAt,
      record.completedAt,
      record.failedAt,
    )
  }

  // MARK: - Constructor

  /**
   * Creates a domain workflow step.
   *
   * @param id - Stable step primary key.
   * @param runId - Owning workflow run primary key.
   * @param key - Stable key within the run.
   * @param position - Zero-based order within the run.
   * @param kind - JOB or APPROVAL.
   * @param status - Current step lifecycle status.
   * @param jobKind - Handler kind when {@link kind} is `JOB`.
   * @param input - Optional step-scoped input projection.
   * @param output - Optional step-scoped output.
   * @param createdAt - Timestamp when the step row was first persisted.
   * @param updatedAt - Timestamp when the step row was last updated.
   * @param startedAt - Timestamp when the step became active.
   * @param completedAt - Timestamp when the step completed successfully.
   * @param failedAt - Timestamp when the step entered a terminal failure state.
   */
  constructor(
    id: string,
    runId: string,
    key: string,
    position: number,
    kind: WorkflowStepKind,
    status: WorkflowStepStatus,
    jobKind: string | null,
    input: unknown | null,
    output: unknown | null,
    createdAt: Date,
    updatedAt: Date,
    startedAt: Date | null = null,
    completedAt: Date | null = null,
    failedAt: Date | null = null,
  ) {
    this.id = id
    this.runId = runId
    this.key = key
    this.position = position
    this.kind = kind
    this.status = status
    this.jobKind = jobKind
    this.input = input
    this.output = output
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.startedAt = startedAt
    this.completedAt = completedAt
    this.failedAt = failedAt
  }
}
