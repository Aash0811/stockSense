const { z } = require("zod");

const createPurchaseOrderSchema = z.object({
  poNumber: z.string().trim().min(2).max(100),

  supplierId: z.string().uuid(),

  warehouseId: z.string().uuid(),

  expectedDate: z.coerce.date().optional(),

  notes: z.string().trim().max(1000).optional(),

  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),

        orderedQuantity: z.coerce
          .number()
          .positive(),

        unitCost: z.coerce
          .number()
          .nonnegative(),
      })
    )
    .min(1),
});

const purchaseOrderIdSchema = z.object({
  id: z.string().uuid(),
});

const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "APPROVED",
    "ORDERED",
    "CANCELLED",
  ]),
});

module.exports = {
  createPurchaseOrderSchema,
  purchaseOrderIdSchema,
  updatePurchaseOrderStatusSchema,
};