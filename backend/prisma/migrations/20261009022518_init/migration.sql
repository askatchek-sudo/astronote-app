-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ARTISTE', 'MANAGER', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nom" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artiste" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "genre2" TEXT,
    "pays" TEXT NOT NULL DEFAULT '🇨🇮',
    "bio" TEXT NOT NULL,
    "img" TEXT NOT NULL DEFAULT '🎵',
    "streams" TEXT NOT NULL DEFAULT '0',
    "tracks" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artiste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "artisteId" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "genre" TEXT,
    "description" TEXT,
    "coverUrl" TEXT,
    "coverEmoji" TEXT NOT NULL DEFAULT '💿',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Morceau" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "artisteId" INTEGER NOT NULL,
    "albumId" INTEGER,
    "duree" TEXT,
    "genre" TEXT,
    "annee" INTEGER NOT NULL,
    "streams" TEXT NOT NULL DEFAULT '0',
    "audioUrl" TEXT,
    "coverUrl" TEXT,
    "isPayant" BOOLEAN NOT NULL DEFAULT false,
    "prix" INTEGER,
    "dureeAcces" INTEGER,
    "expiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Morceau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'concert',
    "date" TIMESTAMP(3) NOT NULL,
    "heure" TEXT NOT NULL DEFAULT '20:00',
    "lieu" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT '🇨🇮',
    "prix" INTEGER,
    "description" TEXT,
    "coverUrl" TEXT,
    "coverEmoji" TEXT NOT NULL DEFAULT '🎤',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Artiste_userId_key" ON "Artiste"("userId");

-- AddForeignKey
ALTER TABLE "Artiste" ADD CONSTRAINT "Artiste_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artisteId_fkey" FOREIGN KEY ("artisteId") REFERENCES "Artiste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Morceau" ADD CONSTRAINT "Morceau_artisteId_fkey" FOREIGN KEY ("artisteId") REFERENCES "Artiste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Morceau" ADD CONSTRAINT "Morceau_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
