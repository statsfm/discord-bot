/*
  Warnings:

  - You are about to drop the column `spotifyUserId` on the `accounts` table. All the data in the column will be lost.
  - Added the required column `spotistatsUserId` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discordUserId" TEXT NOT NULL,
    "spotistatsUserId" TEXT NOT NULL
);
INSERT INTO "new_accounts" ("id", "discordUserId") SELECT "id", "discordUserId" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "new_accounts" RENAME TO "accounts";
CREATE UNIQUE INDEX "accounts.discordUserId_unique" ON "accounts"("discordUserId");
CREATE UNIQUE INDEX "accounts.spotistatsUserId_unique" ON "accounts"("spotistatsUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
