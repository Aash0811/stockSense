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
	const adjustment = await prisma.stockAdjustment.findUnique({
		where: { id },
		include: {
			variant: { include: { product: true } },
			location: { include: { warehouse: true } },
			createdBy: { select: { id: true, name: true, email: true, role: true } },
		},
	});
	if (!adjustment) throw createError("Adjustment not found", 404, "ADJUSTMENT_NOT_FOUND");
	const isSuspicious = Math.abs(adjustment.difference) >= 50 || (adjustment.systemQuantity > 0 && (Math.abs(adjustment.difference) / adjustment.systemQuantity) >= 0.3);
	return { ...adjustment, isSuspicious };
}

async function getAdjustments(query = {}) {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
	const [rawItems, total] = await prisma.$transaction([
		prisma.stockAdjustment.findMany({
			skip: (page - 1) * limit,
			take: limit,
			orderBy: { createdAt: "desc" },
			include: {
				variant: { include: { product: true } },
				location: { include: { warehouse: true } },
				createdBy: { select: { id: true, name: true, email: true, role: true } },
			},
		}),
		prisma.stockAdjustment.count(),
	]);

	const items = rawItems.map((adj) => {
		const isSuspicious = Math.abs(adj.difference) >= 50 || (adj.systemQuantity > 0 && (Math.abs(adj.difference) / adj.systemQuantity) >= 0.3);
		return { ...adj, isSuspicious };
	});

	return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { createAdjustment, getAdjustment, getAdjustments };
