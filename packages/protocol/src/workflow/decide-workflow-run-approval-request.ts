// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the body for approving or rejecting a parked workflow-run step.
 *
 * Clients must name the approval step and supply a stable {@link decisionId}
 * so delayed retries are idempotent and cannot apply to a later gate after the
 * original step already advanced.
 */
export const DecideWorkflowRunApprovalRequestSchema = z
  .object({
    /**
     * Operator or system actor that issued the decision.
     */
    actorId: z.string().min(1),

    /**
     * Client-supplied idempotency key for this decision command.
     */
    decisionId: z.string().min(1),

    /**
     * Optional operator reason recorded on the approval audit trail.
     */
    reason: z.string().min(1).optional(),

    /**
     * Primary key of the `APPROVAL` step the operator is deciding.
     */
    stepId: z.string().min(1),
  })
  .strict()

/**
 * Validated approval decision body exchanged through the shared protocol.
 */
export type DecideWorkflowRunApprovalRequest = z.infer<typeof DecideWorkflowRunApprovalRequestSchema>
