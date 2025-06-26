/*
  Warnings:

  - You are about to drop the column `agentId` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `userId` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_agentId_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "agentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
