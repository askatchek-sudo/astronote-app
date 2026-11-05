/*
  Warnings:

  - You are about to drop the column `cover` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the `_MorceauToPlaylist` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Playlist` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_MorceauToPlaylist" DROP CONSTRAINT "_MorceauToPlaylist_A_fkey";

-- DropForeignKey
ALTER TABLE "_MorceauToPlaylist" DROP CONSTRAINT "_MorceauToPlaylist_B_fkey";

-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "cover",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_MorceauToPlaylist";

-- CreateTable
CREATE TABLE "PlaylistMorceau" (
    "id" SERIAL NOT NULL,
    "playlistId" INTEGER NOT NULL,
    "morceauId" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlaylistMorceau_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistMorceau_playlistId_morceauId_key" ON "PlaylistMorceau"("playlistId", "morceauId");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMorceau" ADD CONSTRAINT "PlaylistMorceau_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistMorceau" ADD CONSTRAINT "PlaylistMorceau_morceauId_fkey" FOREIGN KEY ("morceauId") REFERENCES "Morceau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
