/*
  Warnings:

  - Added the required column `countedQuantity` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `difference` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemQuantity` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `StockAdjustment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockAdjustment" ADD COLUMN     "countedQuantity" INTEGER NOT NULL,
ADD COLUMN     "difference" INTEGER NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL,
ADD COLUMN     "systemQuantity" INTEGER NOT NULL,
ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "StockAdjustment_variantId_idx" ON "StockAdjustment"("variantId");

-- CreateIndex
CREATE INDEX "StockAdjustment_locationId_idx" ON "StockAdjustment"("locationId");

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
