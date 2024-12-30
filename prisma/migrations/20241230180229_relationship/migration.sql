/*
  Warnings:

  - You are about to drop the column `moves` on the `GameMove` table. All the data in the column will be lost.
  - Added the required column `from` to the `GameMove` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to` to the `GameMove` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameMove" DROP COLUMN "moves",
ADD COLUMN     "from" TEXT NOT NULL,
ADD COLUMN     "to" TEXT NOT NULL;
