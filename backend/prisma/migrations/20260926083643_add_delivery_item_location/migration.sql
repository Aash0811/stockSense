/*
  Warnings:

  - Added the required column `locationId` to the `DeliveryItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryItem" ADD COLUMN     "locationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "DeliveryItem_locationId_idx" ON "DeliveryItem"("locationId");

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
