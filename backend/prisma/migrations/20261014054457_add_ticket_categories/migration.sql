/*
  Warnings:

  - You are about to drop the column `utilise` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "utilise",
ADD COLUMN     "categorieId" INTEGER,
ADD COLUMN     "transactionId" TEXT;

-- CreateTable
CREATE TABLE "CategorieTicket" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" INTEGER NOT NULL,
    "placesTotales" INTEGER NOT NULL,
    "placesVendues" INTEGER NOT NULL DEFAULT 0,
    "evenementId" INTEGER NOT NULL,

    CONSTRAINT "CategorieTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategorieTicket" ADD CONSTRAINT "CategorieTicket_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
