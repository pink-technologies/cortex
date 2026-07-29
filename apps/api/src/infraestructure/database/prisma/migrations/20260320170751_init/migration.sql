/*
  Warnings:

  - Added the required column `updatedAt` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "message" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "agent_intent" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_intent_agentId_idx" ON "agent_intent"("agentId");

-- CreateIndex
CREATE INDEX "agent_intent_intentId_idx" ON "agent_intent"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_intent_agentId_intentId_key" ON "agent_intent"("agentId", "intentId");

-- CreateIndex
CREATE UNIQUE INDEX "intent_slug_key" ON "intent"("slug");

-- AddForeignKey
ALTER TABLE "agent_intent" ADD CONSTRAINT "agent_intent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_intent" ADD CONSTRAINT "agent_intent_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
