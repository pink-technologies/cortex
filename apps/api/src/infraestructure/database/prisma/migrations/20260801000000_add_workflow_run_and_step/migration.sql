-- CreateEnum
CREATE TYPE "WorkflowRunStatus" AS ENUM ('PENDING', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkflowStepKind" AS ENUM ('JOB', 'APPROVAL');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "workflow_run" (
    "id" TEXT NOT NULL,
    "definitionKey" TEXT NOT NULL,
    "status" "WorkflowRunStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB NOT NULL,
    "result" JSONB,
    "failure" JSONB,
    "triggerIdentifier" TEXT,
    "activeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "WorkflowStepKind" NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'PENDING',
    "jobKind" TEXT,
    "input" JSONB,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_step_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "execution_job" ADD COLUMN "runId" TEXT;
ALTER TABLE "execution_job" ADD COLUMN "stepId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workflow_run_triggerIdentifier_key" ON "workflow_run"("triggerIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_run_activeKey_key" ON "workflow_run"("activeKey");

-- CreateIndex
CREATE INDEX "workflow_run_status_createdAt_idx" ON "workflow_run"("status", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_run_definitionKey_status_idx" ON "workflow_run"("definitionKey", "status");

-- CreateIndex
CREATE INDEX "workflow_step_runId_status_idx" ON "workflow_step"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_step_runId_key_key" ON "workflow_step"("runId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_step_runId_position_key" ON "workflow_step"("runId", "position");

-- CreateIndex
CREATE INDEX "execution_job_runId_status_idx" ON "execution_job"("runId", "status");

-- CreateIndex
CREATE INDEX "execution_job_stepId_idx" ON "execution_job"("stepId");

-- AddForeignKey
ALTER TABLE "workflow_step" ADD CONSTRAINT "workflow_step_runId_fkey" FOREIGN KEY ("runId") REFERENCES "workflow_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_job" ADD CONSTRAINT "execution_job_runId_fkey" FOREIGN KEY ("runId") REFERENCES "workflow_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_job" ADD CONSTRAINT "execution_job_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
