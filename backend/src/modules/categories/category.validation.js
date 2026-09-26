const { z } = require("zod");

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
};