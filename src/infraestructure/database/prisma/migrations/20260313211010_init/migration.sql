-- CreateEnum
CREATE TYPE "ToolJobStatus" AS ENUM ('COMPLETED', 'FAILED', 'QUEUED', 'PROCESSING');

-- CreateTable
CREATE TABLE "tool_job" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "status" "ToolJobStatus" NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tool_job_toolId_key" ON "tool_job"("toolId");

-- AddForeignKey
ALTER TABLE "tool_job" ADD CONSTRAINT "tool_job_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
