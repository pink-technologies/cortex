/*
  Warnings:

  - The values [active,inactive,pending,unknown] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `status` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_PROVIDER_REGISTRATION', 'PENDING_CONFIRMATION');

-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'UNKNOWN');
ALTER TABLE "accounts" ALTER COLUMN "status" TYPE "AccountStatus_new" USING ("status"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL;
