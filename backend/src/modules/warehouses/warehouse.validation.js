const { z } = require("zod");

const warehouseIdSchema = z.object({
  id: z.string().uuid(),
});

const createWarehouseSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().min(2).max(50),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
});

const updateWarehouseSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  code: z.string().trim().min(2).max(50).optional(),
  address: z.string().trim().max(500).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  warehouseIdSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
};