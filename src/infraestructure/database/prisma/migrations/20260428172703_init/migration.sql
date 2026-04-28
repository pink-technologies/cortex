/*
  Warnings:

  - You are about to drop the column `organizationId` on the `organization_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `organization_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "organization_roles" DROP CONSTRAINT "organization_roles_organizationId_fkey";

-- DropIndex
DROP INDEX "organization_roles_organizationId_key_key";

-- AlterTable
ALTER TABLE "organization_roles" DROP COLUMN "organizationId";

-- CreateIndex
CREATE UNIQUE INDEX "organization_roles_key_key" ON "organization_roles"("key");
