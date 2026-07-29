-- CreateEnum
CREATE TYPE "ExecutionJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED', 'INTERRUPTED');

-- CreateEnum
CREATE TYPE "ExecutionJobAttemptStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'INTERRUPTED');

-- CreateEnum
CREATE TYPE "ExecutionWorkerStatus" AS ENUM ('ACTIVE', 'DRAINING', 'DISABLED');

-- CreateEnum
CREATE TYPE "ExecutionJobEventSource" AS ENUM ('ORCHESTRATOR', 'WORKER', 'HANDLER', 'EXTERNAL');

-- CreateTable
CREATE TABLE "execution_job" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payloadVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "ExecutionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "stage" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "policy" JSONB NOT NULL,
    "result" JSONB,
    "failure" JSONB,
    "sourceType" TEXT,
    "sourceIdentifier" TEXT,
    "triggerIdentifier" TEXT,
    "activeKey" TEXT,
    "maximumAttempts" INTEGER NOT NULL DEFAULT 1,
    "cancellationRequestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "execution_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_job_attempt" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "ExecutionJobAttemptStatus" NOT NULL DEFAULT 'RUNNING',
    "workerId" TEXT NOT NULL,
    "leaseTokenHash" TEXT NOT NULL,
    "leaseExpiresAt" TIMESTAMP(3) NOT NULL,
    "lastLeaseRenewalAt" TIMESTAMP(3) NOT NULL,
    "executionDeadlineAt" TIMESTAMP(3),
    "stage" TEXT,
    "output" JSONB,
    "failure" JSONB,
    "cancellationAcknowledgedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "execution_job_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExecutionWorkerStatus" NOT NULL DEFAULT 'ACTIVE',
    "platform" TEXT NOT NULL,
    "architecture" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "labels" JSONB NOT NULL,
    "metadata" JSONB,
    "maximumConcurrency" INTEGER NOT NULL DEFAULT 1,
    "credentialHash" TEXT NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3),
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_job_event" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attemptId" TEXT,
    "idempotencyKey" TEXT,
    "source" "ExecutionJobEventSource" NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_job_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "execution_job_triggerIdentifier_key" ON "execution_job"("triggerIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "execution_job_activeKey_key" ON "execution_job"("activeKey");

-- CreateIndex
CREATE INDEX "execution_job_status_priority_availableAt_createdAt_idx" ON "execution_job"("status", "priority", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "execution_job_kind_status_idx" ON "execution_job"("kind", "status");

-- CreateIndex
CREATE INDEX "execution_job_sourceType_sourceIdentifier_idx" ON "execution_job"("sourceType", "sourceIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "execution_job_attempt_leaseTokenHash_key" ON "execution_job_attempt"("leaseTokenHash");

-- CreateIndex
CREATE INDEX "execution_job_attempt_jobId_status_idx" ON "execution_job_attempt"("jobId", "status");

-- CreateIndex
CREATE INDEX "execution_job_attempt_workerId_status_idx" ON "execution_job_attempt"("workerId", "status");

-- CreateIndex
CREATE INDEX "execution_job_attempt_status_leaseExpiresAt_idx" ON "execution_job_attempt"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "execution_job_attempt_jobId_number_key" ON "execution_job_attempt"("jobId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "execution_worker_name_key" ON "execution_worker"("name");

-- CreateIndex
CREATE UNIQUE INDEX "execution_worker_credentialHash_key" ON "execution_worker"("credentialHash");

-- CreateIndex
CREATE INDEX "execution_worker_status_lastHeartbeatAt_idx" ON "execution_worker"("status", "lastHeartbeatAt");

-- CreateIndex
CREATE UNIQUE INDEX "execution_job_event_idempotencyKey_key" ON "execution_job_event"("idempotencyKey");

-- CreateIndex
CREATE INDEX "execution_job_event_jobId_createdAt_idx" ON "execution_job_event"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "execution_job_event_attemptId_createdAt_idx" ON "execution_job_event"("attemptId", "createdAt");

-- CreateIndex
CREATE INDEX "execution_job_event_type_createdAt_idx" ON "execution_job_event"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "execution_job_attempt" ADD CONSTRAINT "execution_job_attempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "execution_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_job_attempt" ADD CONSTRAINT "execution_job_attempt_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "execution_worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_job_event" ADD CONSTRAINT "execution_job_event_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "execution_job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_job_event" ADD CONSTRAINT "execution_job_event_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "execution_job_attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
