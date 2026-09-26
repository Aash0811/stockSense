const prisma = require("../../database/prisma");
const inventoryService = require("../inventory/inventory.service");
const { MOVEMENT_TYPES } = require("../inventory/inventory.constants");

function createError(message, statusCode, code) {
	const error = new Error(message);
	error.statusCode = statusCode;
	error.code = code;
	return error;
}

async function createAdjustment(data, userId) {
	return prisma.$transaction(async (tx) => {
		const existing = await tx.stockAdjustment.findUnique({ where: { adjustmentNumber: data.adjustmentNumber } });
		if (existing) throw createError("Adjustment number already exists", 409, "ADJUSTMENT_NUMBER_EXISTS");

		const inventory = await tx.inventory.findUnique({
			where: { variantId_locationId: { variantId: data.variantId, locationId: data.locationId } },
			include: { location: true },
		});
		if (!inventory) throw createError("Inventory record not found", 404, "INVENTORY_NOT_FOUND");
		if (!inventory.location.isActive) throw createError("Location is inactive", 400, "LOCATION_INACTIVE");

		const systemQuantity = Number(inventory.onHand);
		const difference = data.countedQuantity - systemQuantity;
		if (difference === 0) throw createError("Counted quantity matches system quantity", 400, "NO_ADJUSTMENT_REQUIRED");

		await inventoryService.recordMovementInTransaction(tx, {
			variantId: data.variantId,
			locationId: data.locationId,
			type: MOVEMENT_TYPES.ADJUSTMENT,
			quantity: Math.abs(difference),
			direction: difference < 0 ? "DECREASE" : "INCREASE",
			reason: data.reason,
			referenceType: "STOCK_ADJUSTMENT",
			referenceId: data.adjustmentNumber,
			idempotencyKey: `adjustment:${data.adjustmentNumber}`,
			createdById: userId,
		});

		return tx.stockAdjustment.create({
			data: {
				adjustmentNumber: data.adjustmentNumber,
				reason: data.reason,
				status: "COMPLETED",
				variantId: data.variantId,
				locationId: data.locationId,
				systemQuantity,
				countedQuantity: data.countedQuantity,
				difference,
				createdById: userId,
			},
		});
	}, { isolationLevel: "Serializable" });
}

async function getAdjustment(id) {
	const adjustment = await prisma.stockAdjustment.findUnique({ where: { id }, include: { variant: true, location: true, createdBy: true } });
	if (!adjustment) throw createError("Adjustment not found", 404, "ADJUSTMENT_NOT_FOUND");
	return adjustment;
}

module.exports = { createAdjustment, getAdjustment };
