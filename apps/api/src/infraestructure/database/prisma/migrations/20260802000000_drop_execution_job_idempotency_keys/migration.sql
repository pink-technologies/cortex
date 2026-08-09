-- Idempotency now lives on WorkflowRun (triggerIdentifier / activeKey).
-- Execution jobs are always children of a run, so job-level keys are retired.

-- DropIndex
DROP INDEX "execution_job_triggerIdentifier_key";

-- DropIndex
DROP INDEX "execution_job_activeKey_key";

-- AlterTable
ALTER TABLE "execution_job" DROP COLUMN "triggerIdentifier",
DROP COLUMN "activeKey";
