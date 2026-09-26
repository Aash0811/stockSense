const { z } = require("zod");

const trackingTypeEnum = z.enum([
  "NONE",
  "BATCH",
  "SERIAL",
]);

const productStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
  "ARCHIVED",
]);

const createVariantSchema = z.object({
  name: z.string().trim().min(1).max(150),
  sku: z.string().trim().min(2).max(100),
  barcode: z.string().trim().max(100).optional(),
  price: z.coerce.number().nonnegative().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),

  sku: z.string().trim().min(2).max(100),

  description: z.string().trim().max(2000).optional(),

  brand: z.string().trim().max(100).optional(),

  barcode: z.string().trim().max(100).optional(),

  categoryId: z.string().uuid(),

  trackingType: trackingTypeEnum.default("NONE"),

  unitName: z.string().trim().min(1).max(50).default("piece"),

  minimumStock: z.coerce.number().nonnegative().default(0),

  safetyStock: z.coerce.number().nonnegative().default(0),

  leadTimeDays: z.coerce.number().int().nonnegative().default(0),

  reorderPoint: z.coerce.number().nonnegative().default(0),

  status: productStatusEnum.default("ACTIVE"),

  variants: z.array(createVariantSchema).optional(),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),

  sku: z.string().trim().min(2).max(100).optional(),

  description: z.string().trim().max(2000).nullable().optional(),

  brand: z.string().trim().max(100).nullable().optional(),

  barcode: z.string().trim().max(100).nullable().optional(),

  categoryId: z.string().uuid().optional(),

  trackingType: trackingTypeEnum.optional(),

  unitName: z.string().trim().min(1).max(50).optional(),

  minimumStock: z.coerce.number().nonnegative().optional(),

  safetyStock: z.coerce.number().nonnegative().optional(),

  leadTimeDays: z.coerce.number().int().nonnegative().optional(),

  reorderPoint: z.coerce.number().nonnegative().optional(),

  status: productStatusEnum.optional(),
});

const updateVariantSchema = createVariantSchema.partial();

const idSchema = z.object({
  id: z.string().uuid(),
});

const variantIdSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  idSchema,
  variantIdSchema,
};