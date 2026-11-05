/*
  Warnings:

  - The `streams` column on the `Morceau` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Morceau" DROP COLUMN "streams",
ADD COLUMN     "streams" INTEGER NOT NULL DEFAULT 0;
