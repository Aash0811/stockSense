const { z } = require("zod");

const deliveryStatusSchema = z.enum([
  "DRAFT",
  "READY",
  "PICKING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
]);

const deliveryItemSchema = z.object({
  variantId: z.string().uuid(),
  locationId: z.string().uuid(),
  orderedQuantity: z.number().int().positive(),
});

const createDeliverySchema = z.object({
  deliveryNumber: z.string().trim().min(1).max(100),
  warehouseId: z.string().uuid(),
  items: z.array(deliveryItemSchema).min(1),
});

const updateDeliveryStatusSchema = z.object({
  status: deliveryStatusSchema,
});

const fulfillDeliveryItemSchema = z.object({
  deliveryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const fulfillDeliverySchema = z.object({
  items: z.array(fulfillDeliveryItemSchema).min(1),
});

const deliveryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: deliveryStatusSchema.optional(),
  warehouseId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

module.exports = {
  deliveryStatusSchema,
  createDeliverySchema,
  updateDeliveryStatusSchema,
  fulfillDeliverySchema,
  deliveryListQuerySchema,
};