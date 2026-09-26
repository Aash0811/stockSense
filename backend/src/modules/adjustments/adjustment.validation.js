const { z } = require("zod");

const adjustmentIdSchema = z.object({ id: z.string().uuid() });

const createAdjustmentSchema = z.object({
	adjustmentNumber: z.string().trim().min(1).max(100),
	variantId: z.string().uuid(),
	locationId: z.string().uuid(),
	countedQuantity: z.number().int().nonnegative(),
	reason: z.string().trim().min(3).max(500),
});

module.exports = { adjustmentIdSchema, createAdjustmentSchema };
