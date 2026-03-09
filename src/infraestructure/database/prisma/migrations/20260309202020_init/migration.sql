-- CreateEnum
<<<<<<<< HEAD:src/infraestructure/database/prisma/migrations/20260310201232_init/migration.sql
CREATE TYPE "AgentStatus" AS ENUM
('ACTIVE', 'DEPRECATED');
========
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "AccessPolicyType" AS ENUM ('ALL', 'ALLOWLIST', 'NONE');
>>>>>>>> 459c7e5 (feat: Add setup initial for Agents   Module):src/infraestructure/database/prisma/migrations/20260309202020_init/migration.sql

-- CreateEnum
CREATE TYPE "AccessPolicyType" AS ENUM
('ALL', 'ALLOWLIST', 'NONE');

-- CreateEnum
CREATE TYPE "JobEventType" AS ENUM
('DONE', 'ERROR', 'STATUS', 'TOKEN', 'TOOL_CALL', 'TOOL_RESULT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM
('CANCELED', 'COMPLETED', 'FAILED', 'QUEUED', 'RUNNING');

-- CreateEnum
CREATE TYPE "Role" AS ENUM
('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "SkillExecutionStatus" AS ENUM
('CANCELED', 'FAILED', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "SkillExecutionTriggerType" AS ENUM
('CHAT', 'API', 'JOB', 'MANUAL');

-- CreateEnum
CREATE TYPE "SkillInstallationStatus" AS ENUM
('DISABLED', 'ENABLED');

-- CreateEnum
CREATE TYPE "SkillInstallationScopeType" AS ENUM
('GLOBAL', 'USER', 'WORKSPACE');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM
('ARCHIVED', 'ACTIVE', 'DISABLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "SkillSourceType" AS ENUM
('GIT', 'LOCAL', 'NPM');

-- CreateTable
<<<<<<<< HEAD:src/infraestructure/database/prisma/migrations/20260310201232_init/migration.sql
CREATE TABLE "agent"
(
========
CREATE TABLE "agent" (
>>>>>>>> 459c7e5 (feat: Add setup initial for Agents   Module):src/infraestructure/database/prisma/migrations/20260309202020_init/migration.sql
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "name" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
<<<<<<<< HEAD:src/infraestructure/database/prisma/migrations/20260310201232_init/migration.sql
CREATE TABLE "agent_skill"
(
========
CREATE TABLE "agent_skill" (
>>>>>>>> 459c7e5 (feat: Add setup initial for Agents   Module):src/infraestructure/database/prisma/migrations/20260309202020_init/migration.sql
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
<<<<<<<< HEAD:src/infraestructure/database/prisma/migrations/20260310201232_init/migration.sql
CREATE TABLE "chat"
(
========
CREATE TABLE "chat" (
>>>>>>>> 459c7e5 (feat: Add setup initial for Agents   Module):src/infraestructure/database/prisma/migrations/20260309202020_init/migration.sql
    "id" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message"
(
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobId" TEXT,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job"
(
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "triggerMessageId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "resultMessageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_event"
(
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "JobEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill"
(
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SkillStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_release"
(
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sourceType" "SkillSourceType" NOT NULL,
    "packageName" TEXT,
    "packageVersion" TEXT,
    "repositoryUrl" TEXT,
    "commitSha" TEXT,
    "entrypoint" TEXT,
    "checksum" TEXT,
    "manifest" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_installation"
(
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillReleaseId" TEXT NOT NULL,
    "scopeType" "SkillInstallationScopeType" NOT NULL,
    "scopeId" TEXT NOT NULL,
    "installationPath" TEXT,
    "status" "SkillInstallationStatus" NOT NULL DEFAULT 'ENABLED',
    "config" JSONB,
    "installedBy" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_permission"
(
    "id" TEXT NOT NULL,
    "skillInstallationId" TEXT NOT NULL,
    "networkPolicy" "AccessPolicyType" NOT NULL,
    "networkAllowlist" JSONB,
    "shellPolicy" "AccessPolicyType" NOT NULL,
    "fsReadPolicy" "AccessPolicyType" NOT NULL,
    "fsReadAllowlist" JSONB,
    "fsWritePolicy" "AccessPolicyType" NOT NULL,
    "fsWriteAllowlist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_execution"
(
    "id" TEXT NOT NULL,
    "skillInstallationId" TEXT NOT NULL,
    "status" "SkillExecutionStatus" NOT NULL,
    "triggerType" "SkillExecutionTriggerType" NOT NULL,
    "triggeredBy" TEXT,
    "correlationId" TEXT,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorText" TEXT,
    "exitCode" INTEGER,
    "chatId" TEXT,
    "jobId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_execution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_skill_agentId_skillId_key" ON "agent_skill"("agentId", "skillId");

-- CreateIndex
CREATE INDEX "message_chatId_idx" ON "message"("chatId");

-- CreateIndex
CREATE INDEX "job_chatId_idx" ON "job"("chatId");

-- CreateIndex
CREATE INDEX "job_status_idx" ON "job"("status");

-- CreateIndex
CREATE INDEX "job_event_jobId_idx" ON "job_event"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_slug_key" ON "skill"("slug");

-- CreateIndex
CREATE INDEX "skill_release_skillId_idx" ON "skill_release"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_release_skillId_version_key" ON "skill_release"("skillId", "version");

-- CreateIndex
CREATE INDEX "skill_installation_skillReleaseId_idx" ON "skill_installation"("skillReleaseId");

-- CreateIndex
CREATE INDEX "skill_installation_scopeType_scopeId_idx" ON "skill_installation"("scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_installation_scopeType_scopeId_skillId_key" ON "skill_installation"("scopeType", "scopeId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_permission_skillInstallationId_key" ON "skill_permission"("skillInstallationId");

-- CreateIndex
CREATE INDEX "skill_execution_skillInstallationId_startedAt_idx" ON "skill_execution"("skillInstallationId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "skill_execution_status_startedAt_idx" ON "skill_execution"("status", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "skill_execution_chatId_idx" ON "skill_execution"("chatId");

-- CreateIndex
CREATE INDEX "skill_execution_jobId_idx" ON "skill_execution"("jobId");

-- CreateIndex
CREATE INDEX "skill_execution_correlationId_idx" ON "skill_execution"("correlationId");

-- AddForeignKey
<<<<<<<< HEAD:src/infraestructure/database/prisma/migrations/20260310201232_init/migration.sql
ALTER TABLE "agent_skill" ADD CONSTRAINT "agent_skill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent"("id")
ON DELETE RESTRICT ON
UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skill" ADD CONSTRAINT "agent_skill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id")
ON DELETE RESTRICT ON
UPDATE CASCADE;
========
ALTER TABLE "agent_skill" ADD CONSTRAINT "agent_skill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_skill" ADD CONSTRAINT "agent_skill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
>>>>>>>> 459c7e5 (feat: Add setup initial for Agents   Module):src/infraestructure/database/prisma/migrations/20260309202020_init/migration.sql

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_triggerMessageId_fkey" FOREIGN KEY ("triggerMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_resultMessageId_fkey" FOREIGN KEY ("resultMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_event" ADD CONSTRAINT "job_event_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_release" ADD CONSTRAINT "skill_release_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_installation" ADD CONSTRAINT "skill_installation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_installation" ADD CONSTRAINT "skill_installation_skillReleaseId_fkey" FOREIGN KEY ("skillReleaseId") REFERENCES "skill_release"("id")
ON DELETE RESTRICT ON
UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_permission" ADD CONSTRAINT "skill_permission_skillInstallationId_fkey" FOREIGN KEY ("skillInstallationId") REFERENCES "skill_installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_execution" ADD CONSTRAINT "skill_execution_skillInstallationId_fkey" FOREIGN KEY ("skillInstallationId") REFERENCES "skill_installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_execution" ADD CONSTRAINT "skill_execution_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_execution" ADD CONSTRAINT "skill_execution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
