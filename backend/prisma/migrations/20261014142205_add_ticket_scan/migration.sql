-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "dateUtilisation" TIMESTAMP(3),
ADD COLUMN     "utilise" BOOLEAN NOT NULL DEFAULT false;
