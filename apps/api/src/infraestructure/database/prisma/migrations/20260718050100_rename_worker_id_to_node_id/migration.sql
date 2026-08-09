-- Rename execution attempt ownership from workerId to nodeId.

ALTER TABLE "execution_job_attempt" DROP CONSTRAINT "execution_job_attempt_workerId_fkey";

DROP INDEX "execution_job_attempt_workerId_status_idx";

ALTER TABLE "execution_job_attempt" RENAME COLUMN "workerId" TO "nodeId";

CREATE INDEX "execution_job_attempt_nodeId_status_idx" ON "execution_job_attempt"("nodeId", "status");

ALTER TABLE "execution_job_attempt" ADD CONSTRAINT "execution_job_attempt_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "execution_worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
