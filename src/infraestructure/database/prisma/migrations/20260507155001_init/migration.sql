/*
  Warnings:

  - You are about to drop the `integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_integrations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "organization_integrations" DROP CONSTRAINT "organization_integrations_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "organization_integrations" DROP CONSTRAINT "organization_integrations_organizationId_fkey";

-- DropTable
DROP TABLE "integrations";

-- DropTable
DROP TABLE "organization_integrations";

-- DropEnum
DROP TYPE "IntegrationProvider";

-- DropEnum
DROP TYPE "IntegrationStatus";
