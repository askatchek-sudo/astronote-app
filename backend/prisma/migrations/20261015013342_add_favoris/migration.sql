-- CreateTable
CREATE TABLE "Favori" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "morceauId" INTEGER NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Favori_userId_morceauId_key" ON "Favori"("userId", "morceauId");

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_morceauId_fkey" FOREIGN KEY ("morceauId") REFERENCES "Morceau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
