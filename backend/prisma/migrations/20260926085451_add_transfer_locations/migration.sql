/*
  Warnings:

  - Added the required column `destinationLocationId` to the `TransferItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceLocationId` to the `TransferItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransferItem" ADD COLUMN     "destinationLocationId" TEXT NOT NULL,
ADD COLUMN     "sourceLocationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "TransferItem_sourceLocationId_idx" ON "TransferItem"("sourceLocationId");

-- CreateIndex
CREATE INDEX "TransferItem_destinationLocationId_idx" ON "TransferItem"("destinationLocationId");

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
