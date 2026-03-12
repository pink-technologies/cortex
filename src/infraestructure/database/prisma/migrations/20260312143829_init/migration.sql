/*
  Warnings:

  - You are about to drop the column `skillReleaseId` on the `skill_installation` table. All the data in the column will be lost.
  - You are about to drop the `skill_execution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_release` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ModelProviderType" AS ENUM ('OPENAI', 'AZURE', 'GEMINI', 'CLAUDE');

-- CreateEnum
CREATE TYPE "ConnectionRole" AS ENUM ('PRIMARY', 'FALLBACK', 'CLASSIFIER');

-- CreateEnum
CREATE TYPE "datasource_auth_type" AS ENUM ('NONE', 'API_KEY', 'EMAIL_PASSWORD', 'USERNAME_PASSWORD', 'TOKEN');

-- DropForeignKey
ALTER TABLE "skill_execution" DROP CONSTRAINT "skill_execution_chatId_fkey";

-- DropForeignKey
ALTER TABLE "skill_execution" DROP CONSTRAINT "skill_execution_jobId_fkey";

-- DropForeignKey
ALTER TABLE "skill_execution" DROP CONSTRAINT "skill_execution_skillInstallationId_fkey";

-- DropForeignKey
ALTER TABLE "skill_installation" DROP CONSTRAINT "skill_installation_skillReleaseId_fkey";

-- DropForeignKey
ALTER TABLE "skill_permission" DROP CONSTRAINT "skill_permission_skillInstallationId_fkey";

-- DropForeignKey
ALTER TABLE "skill_release" DROP CONSTRAINT "skill_release_skillId_fkey";

-- DropIndex
DROP INDEX "skill_installation_skillReleaseId_idx";

-- AlterTable
ALTER TABLE "skill_installation" DROP COLUMN "skillReleaseId";

-- DropTable
DROP TABLE "skill_execution";

-- DropTable
DROP TABLE "skill_permission";

-- DropTable
DROP TABLE "skill_release";

-- DropEnum
DROP TYPE "AccessPolicyType";

-- DropEnum
DROP TYPE "SkillExecutionStatus";

-- DropEnum
DROP TYPE "SkillExecutionTriggerType";

-- DropEnum
DROP TYPE "SkillSourceType";

-- CreateTable
CREATE TABLE "agent_model_connection" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "modelConnectionId" TEXT NOT NULL,
    "role" "ConnectionRole" NOT NULL DEFAULT 'PRIMARY',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_model_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modelProviderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_connection" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ModelProviderType" NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasource_provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authType" "datasource_auth_type" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasource_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasource_connection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "providerId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasource_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_connection" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_version" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_tool" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_tool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_model_connection_agentId_idx" ON "agent_model_connection"("agentId");

-- CreateIndex
CREATE INDEX "agent_model_connection_modelConnectionId_idx" ON "agent_model_connection"("modelConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_model_connection_agentId_modelConnectionId_key" ON "agent_model_connection"("agentId", "modelConnectionId");

-- CreateIndex
CREATE INDEX "model_modelProviderId_idx" ON "model"("modelProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "model_slug_key" ON "model"("slug");

-- CreateIndex
CREATE INDEX "model_connection_modelId_idx" ON "model_connection"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "model_provider_slug_key" ON "model_provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "datasource_provider_slug_key" ON "datasource_provider"("slug");

-- CreateIndex
CREATE INDEX "datasource_connection_providerId_idx" ON "datasource_connection"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "datasource_connection_slug_key" ON "datasource_connection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skill_connection_skillId_connectionId_key" ON "skill_connection"("skillId", "connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_slug_key" ON "tool"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tool_version_toolId_version_key" ON "tool_version"("toolId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "skill_tool_skillId_toolId_key" ON "skill_tool"("skillId", "toolId");

-- AddForeignKey
ALTER TABLE "agent_model_connection" ADD CONSTRAINT "agent_model_connection_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_model_connection" ADD CONSTRAINT "agent_model_connection_modelConnectionId_fkey" FOREIGN KEY ("modelConnectionId") REFERENCES "model_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model" ADD CONSTRAINT "model_modelProviderId_fkey" FOREIGN KEY ("modelProviderId") REFERENCES "model_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_connection" ADD CONSTRAINT "model_connection_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasource_connection" ADD CONSTRAINT "datasource_connection_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "datasource_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_connection" ADD CONSTRAINT "skill_connection_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_connection" ADD CONSTRAINT "skill_connection_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "datasource_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_version" ADD CONSTRAINT "tool_version_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tool" ADD CONSTRAINT "skill_tool_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_tool" ADD CONSTRAINT "skill_tool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
