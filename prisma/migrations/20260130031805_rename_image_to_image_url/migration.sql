/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "imageUrl",
ADD COLUMN     "image_url" TEXT NOT NULL DEFAULT '';
