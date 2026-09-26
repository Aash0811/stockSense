const { z } = require("zod");

const createReceiptSchema = z.object({
  receiptNumber: z.string().trim().min(2).max(100),

  purchaseOrderId: z.string().uuid().optional().nullable(),

  warehouseId: z.string().uuid(),

  status: z.enum(["DRAFT", "WAITING", "RECEIVED", "VALIDATED"]).optional().default("RECEIVED"),

  items: z
    .array(
      z.object({
        purchaseOrderItemId: z.string().uuid().optional().nullable(),

        variantId: z.string().uuid(),

        locationId: z.string().uuid(),

        receivedQuantity: z.coerce
          .number()
          .positive(),

        damagedQuantity: z.coerce
          .number()
          .nonnegative()
          .default(0),

        notes: z.string().trim().max(500).optional(),
      })
    )
    .min(1),
});

const receiptIdSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  createReceiptSchema,
  receiptIdSchema,
};