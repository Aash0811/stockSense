const { z } = require("zod");

const inventoryQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const movementQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  type: z
    .enum([
      "RECEIPT",
      "DELIVERY",
      "TRANSFER_OUT",
      "TRANSFER_IN",
      "ADJUSTMENT",
      "RETURN",
      "WRITE_OFF",
      "RESERVATION",
      "RESERVATION_RELEASE",
    ])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const inventoryIdSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  inventoryQuerySchema,
  movementQuerySchema,
  inventoryIdSchema,
};