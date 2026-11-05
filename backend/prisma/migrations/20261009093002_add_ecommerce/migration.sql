/*
  Warnings:

  - The values [ARTISTE,MANAGER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Artiste` table. All the data in the column will be lost.
  - You are about to drop the column `expiration` on the `Morceau` table. All the data in the column will be lost.
  - Made the column `prix` on table `Evenement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Artiste" DROP CONSTRAINT "Artiste_userId_fkey";

-- DropIndex
DROP INDEX "Artiste_userId_key";

-- AlterTable
ALTER TABLE "Artiste" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Evenement" ADD COLUMN     "places" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "prix" SET NOT NULL;

-- AlterTable
ALTER TABLE "Morceau" DROP COLUMN "expiration";

-- CreateTable
CREATE TABLE "Achat" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "morceauId" INTEGER NOT NULL,
    "prixPaye" INTEGER NOT NULL,
    "dateAchat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Achat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "evenementId" INTEGER NOT NULL,
    "prixPaye" INTEGER NOT NULL,
    "codeUnique" TEXT NOT NULL,
    "dateAchat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilise" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sujet" TEXT,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_codeUnique_key" ON "Ticket"("codeUnique");

-- AddForeignKey
ALTER TABLE "Achat" ADD CONSTRAINT "Achat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achat" ADD CONSTRAINT "Achat_morceauId_fkey" FOREIGN KEY ("morceauId") REFERENCES "Morceau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
