-- Retire the legacy chat-pipeline job tables.
-- Orchestration work uses execution_job / execution_job_event / workflow_*.

-- DropForeignKey
ALTER TABLE "job_event" DROP CONSTRAINT "job_event_jobId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_jobId_fkey";

-- DropForeignKey
ALTER TABLE "job" DROP CONSTRAINT "job_chatId_fkey";

-- DropForeignKey
ALTER TABLE "job" DROP CONSTRAINT "job_triggerMessageId_fkey";

-- DropForeignKey
ALTER TABLE "job" DROP CONSTRAINT "job_resultMessageId_fkey";

-- DropTable
DROP TABLE "job_event";

-- DropTable
DROP TABLE "job";

-- AlterTable
ALTER TABLE "message" DROP COLUMN "jobId";

-- DropEnum
DROP TYPE "JobEventType";

-- DropEnum
DROP TYPE "JobStatus";
