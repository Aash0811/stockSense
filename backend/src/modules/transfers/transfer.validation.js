const { z } = require("zod");

const transferIdSchema = z.object({
	id: z.string().uuid(),
});

const transferItemSchema = z.object({
	variantId: z.string().uuid(),
	sourceLocationId: z.string().uuid(),
	destinationLocationId: z.string().uuid(),
	quantity: z.number().int().positive(),
});

const createTransferSchema = z.object({
	transferNumber: z.string().trim().min(1).max(100),
	sourceWarehouseId: z.string().uuid(),
	destinationWarehouseId: z.string().uuid(),
	items: z.array(transferItemSchema).min(1),
});

const receiveTransferSchema = z.object({
	items: z.array(z.object({
		transferItemId: z.string().uuid(),
		receivedQuantity: z.number().int().positive(),
	})).min(1),
});

module.exports = {
	transferIdSchema,
	createTransferSchema,
	receiveTransferSchema,
};
