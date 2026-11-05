-- CreateTable
CREATE TABLE "Playlist" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "cover" TEXT NOT NULL DEFAULT '🎵',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MorceauToPlaylist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MorceauToPlaylist_AB_unique" ON "_MorceauToPlaylist"("A", "B");

-- CreateIndex
CREATE INDEX "_MorceauToPlaylist_B_index" ON "_MorceauToPlaylist"("B");

-- AddForeignKey
ALTER TABLE "_MorceauToPlaylist" ADD CONSTRAINT "_MorceauToPlaylist_A_fkey" FOREIGN KEY ("A") REFERENCES "Morceau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MorceauToPlaylist" ADD CONSTRAINT "_MorceauToPlaylist_B_fkey" FOREIGN KEY ("B") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
