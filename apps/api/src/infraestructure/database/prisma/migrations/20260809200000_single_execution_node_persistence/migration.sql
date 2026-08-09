-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NodeArchitecture" AS ENUM ('ARM64', 'X64');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NodeOperatingSystem" AS ENUM ('MACOS', 'LINUX', 'WINDOWS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NodeState" AS ENUM ('ENABLED', 'DISABLED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "nodes" (
    "id" UUID NOT NULL,
    "installationId" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "operatingSystem" "NodeOperatingSystem" NOT NULL,
    "architecture" "NodeArchitecture" NOT NULL,
    "state" "NodeState" NOT NULL DEFAULT 'ENABLED',
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportedKinds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" VARCHAR(64),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_installationId_key" ON "nodes"("installationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "nodes_state_idx" ON "nodes"("state");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "nodes_lastSeenAt_idx" ON "nodes"("lastSeenAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "nodes_operatingSystem_architecture_idx" ON "nodes"("operatingSystem", "architecture");

-- DropForeignKey
ALTER TABLE "execution_job_event" DROP CONSTRAINT IF EXISTS "execution_job_event_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "execution_job_attempt" DROP CONSTRAINT IF EXISTS "execution_job_attempt_jobId_fkey";

-- DropForeignKey
ALTER TABLE "execution_job_attempt" DROP CONSTRAINT IF EXISTS "execution_job_attempt_nodeId_fkey";

-- DropForeignKey
ALTER TABLE "execution_job_attempt" DROP CONSTRAINT IF EXISTS "execution_job_attempt_workerId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "execution_job_event_attemptId_createdAt_idx";

-- AlterTable
ALTER TABLE "execution_job_event" DROP COLUMN IF EXISTS "attemptId";
ALTER TABLE "execution_job_event" DROP COLUMN IF EXISTS "stage";

-- DropTable
DROP TABLE IF EXISTS "execution_job_attempt";

-- DropTable
DROP TABLE IF EXISTS "execution_worker";

-- DropEnum
DROP TYPE IF EXISTS "ExecutionJobAttemptStatus";

-- DropEnum
DROP TYPE IF EXISTS "ExecutionWorkerStatus";
