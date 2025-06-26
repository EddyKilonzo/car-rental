/*
  Warnings:

  - You are about to drop the column `userId` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `agentId` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_userId_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "userId",
ADD COLUMN     "agentId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
