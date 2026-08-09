-- CreateEnum
CREATE TYPE "WorkflowApprovalDecisionOutcome" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "workflow_approval_decision" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "outcome" "WorkflowApprovalDecisionOutcome" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_approval_decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_approval_decision_decisionId_key" ON "workflow_approval_decision"("decisionId");

-- CreateIndex
CREATE INDEX "workflow_approval_decision_runId_createdAt_idx" ON "workflow_approval_decision"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_approval_decision_stepId_idx" ON "workflow_approval_decision"("stepId");

-- AddForeignKey
ALTER TABLE "workflow_approval_decision" ADD CONSTRAINT "workflow_approval_decision_runId_fkey" FOREIGN KEY ("runId") REFERENCES "workflow_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_approval_decision" ADD CONSTRAINT "workflow_approval_decision_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;
