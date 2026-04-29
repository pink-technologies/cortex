-- AlterEnum
BEGIN;
CREATE TYPE "InvitationStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
ALTER TABLE "invitations" ALTER COLUMN "status" TYPE "InvitationStatus_new" USING ("status"::text::"InvitationStatus_new");
ALTER TYPE "InvitationStatus" RENAME TO "InvitationStatus_old";
ALTER TYPE "InvitationStatus_new" RENAME TO "InvitationStatus";
DROP TYPE "public"."InvitationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MembershipStatus_new" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
ALTER TABLE "public"."organization_memberships" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organization_memberships" ALTER COLUMN "status" TYPE "MembershipStatus_new" USING ("status"::text::"MembershipStatus_new");
ALTER TYPE "MembershipStatus" RENAME TO "MembershipStatus_old";
ALTER TYPE "MembershipStatus_new" RENAME TO "MembershipStatus";
DROP TYPE "public"."MembershipStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "OrganizationStatus_new" USING ("status"::text::"OrganizationStatus_new");
ALTER TYPE "OrganizationStatus" RENAME TO "OrganizationStatus_old";
ALTER TYPE "OrganizationStatus_new" RENAME TO "OrganizationStatus";
DROP TYPE "public"."OrganizationStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionCategory_new" AS ENUM ('GLOBAL', 'SYSTEM');
ALTER TABLE "public"."permissions" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "category" TYPE "PermissionCategory_new" USING ("category"::text::"PermissionCategory_new");
ALTER TYPE "PermissionCategory" RENAME TO "PermissionCategory_old";
ALTER TYPE "PermissionCategory_new" RENAME TO "PermissionCategory";
DROP TYPE "public"."PermissionCategory_old";
ALTER TABLE "permissions" ALTER COLUMN "category" SET DEFAULT 'GLOBAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionScope_new" AS ENUM ('ORGANIZATION');
ALTER TABLE "public"."permissions" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "scope" TYPE "PermissionScope_new" USING ("scope"::text::"PermissionScope_new");
ALTER TYPE "PermissionScope" RENAME TO "PermissionScope_old";
ALTER TYPE "PermissionScope_new" RENAME TO "PermissionScope";
DROP TYPE "public"."PermissionScope_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
ALTER TABLE "public"."permissions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "status" TYPE "PermissionStatus_new" USING ("status"::text::"PermissionStatus_new");
ALTER TYPE "PermissionStatus" RENAME TO "PermissionStatus_old";
ALTER TYPE "PermissionStatus_new" RENAME TO "PermissionStatus";
DROP TYPE "public"."PermissionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoleStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
ALTER TABLE "public"."organization_roles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organization_roles" ALTER COLUMN "status" TYPE "RoleStatus_new" USING ("status"::text::"RoleStatus_new");
ALTER TYPE "RoleStatus" RENAME TO "RoleStatus_old";
ALTER TYPE "RoleStatus_new" RENAME TO "RoleStatus";
DROP TYPE "public"."RoleStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
ALTER TABLE "public"."organization_roles" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "organization_roles" ALTER COLUMN "type" TYPE "RoleType_new" USING ("type"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_CONFIRMATION');
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "organization_memberships" DROP CONSTRAINT "organization_memberships_roleId_fkey";

-- DropForeignKey
ALTER TABLE "organization_roles" DROP CONSTRAINT "organization_roles_organizationId_fkey";

-- DropIndex
DROP INDEX "organization_role_permissions_deletedAt_idx";

-- DropIndex
DROP INDEX "organization_roles_organizationId_key_key";

-- DropIndex
DROP INDEX "organizations_slug_key";

-- DropIndex
DROP INDEX "permissions_key_key";

-- DropIndex
DROP INDEX "user_profiles_phoneNumber_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "organization_memberships" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization_role_permissions" DROP COLUMN "deletedAt",
ALTER COLUMN "assignedAt" SET NOT NULL,
ALTER COLUMN "assignedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "organization_roles" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "organizationId",
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "permissions" ALTER COLUMN "category" SET DEFAULT 'GLOBAL',
ALTER COLUMN "scope" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT;

-- DropEnum
DROP TYPE "PermissionType";

-- CreateIndex
CREATE UNIQUE INDEX "organization_roles_key_key" ON "organization_roles"("key") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phoneNumber_key" ON "user_profiles"("phoneNumber") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE ("deletedAt" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognitoSub_key" ON "users"("cognitoSub") WHERE ("deletedAt" IS NULL);

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organization_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organization_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
