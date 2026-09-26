const { z } = require("zod");

const locationTypeEnum = z.enum([
  "WAREHOUSE",
  "ZONE",
  "AISLE",
  "RACK",
  "SHELF",
  "BIN",
]);

const locationIdSchema = z.object({
  id: z.string().uuid(),
});

const warehouseIdSchema = z.object({
  warehouseId: z.string().uuid(),
});

const createLocationSchema = z.object({
  warehouseId: z.string().uuid(),

  parentId: z.string().uuid().nullable().optional(),

  name: z.string().trim().min(1).max(150),

  code: z.string().trim().min(1).max(50),

  type: locationTypeEnum,

  isActive: z.boolean().optional(),
});

const updateLocationSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),

  code: z.string().trim().min(1).max(50).optional(),

  type: locationTypeEnum.optional(),

  isActive: z.boolean().optional(),
});

module.exports = {
  locationTypeEnum,
  locationIdSchema,
  warehouseIdSchema,
  createLocationSchema,
  updateLocationSchema,
};