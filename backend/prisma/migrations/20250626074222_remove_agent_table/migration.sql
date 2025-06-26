/*
  Warnings:

  - You are about to drop the `agents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_userId_fkey";

-- DropTable
DROP TABLE "agents";
