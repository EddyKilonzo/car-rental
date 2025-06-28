/*
  Warnings:

  - You are about to drop the column `images` on the `vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "licenseDocumentUrl" TEXT,
ADD COLUMN     "profileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "images",
ADD COLUMN     "documentUrls" TEXT[],
ADD COLUMN     "exteriorImages" TEXT[],
ADD COLUMN     "galleryImages" TEXT[],
ADD COLUMN     "interiorImages" TEXT[],
ADD COLUMN     "mainImageUrl" TEXT;
