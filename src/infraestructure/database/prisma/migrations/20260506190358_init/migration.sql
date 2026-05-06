-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('SLACK', 'TRELLO', 'QUALITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'REVOKED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "IntegrationProvider" NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "secretRef" TEXT,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "organization_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_integrations_organizationId_integrationId_key" ON "organization_integrations"("organizationId", "integrationId");

-- AddForeignKey
ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
