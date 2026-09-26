const prisma = require("../../database/prisma");
const inventoryService = require("../inventory/inventory.service");
const { MOVEMENT_TYPES } = require("../inventory/inventory.constants");

function error(message, statusCode, code) {
	const value = new Error(message);
	value.statusCode = statusCode;
	value.code = code;
	return value;
}

async function ensureWarehouse(tx, id) {
	const warehouse = await tx.warehouse.findUnique({ where: { id } });
	if (!warehouse) throw error("Warehouse not found", 404, "WAREHOUSE_NOT_FOUND");
	if (!warehouse.isActive) throw error("Warehouse is inactive", 400, "WAREHOUSE_INACTIVE");
	return warehouse;
}

async function ensureItemLocations(tx, item, sourceWarehouseId, destinationWarehouseId) {
	const [source, destination, variant] = await Promise.all([
		tx.location.findUnique({ where: { id: item.sourceLocationId } }),
		tx.location.findUnique({ where: { id: item.destinationLocationId } }),
		tx.productVariant.findUnique({ where: { id: item.variantId }, include: { product: true } }),
	]);

	if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
		throw error("Variant is inactive or not found", 400, "VARIANT_INACTIVE");
	}
	if (!source || !source.isActive || source.warehouseId !== sourceWarehouseId) {
		throw error("Invalid source location", 400, "INVALID_SOURCE_LOCATION");
	}
	if (!destination || !destination.isActive || destination.warehouseId !== destinationWarehouseId) {
		throw error("Invalid destination location", 400, "INVALID_DESTINATION_LOCATION");
	}
}

async function createTransfer(data) {
	return prisma.$transaction(async (tx) => {
		if (data.sourceWarehouseId === data.destinationWarehouseId) {
			throw error("Source and destination warehouses must differ", 400, "SAME_WAREHOUSE_TRANSFER");
		}
		await ensureWarehouse(tx, data.sourceWarehouseId);
		await ensureWarehouse(tx, data.destinationWarehouseId);
		if (await tx.transfer.findUnique({ where: { transferNumber: data.transferNumber } })) {
			throw error("Transfer number already exists", 409, "TRANSFER_NUMBER_EXISTS");
		}
		for (const item of data.items) {
			await ensureItemLocations(tx, item, data.sourceWarehouseId, data.destinationWarehouseId);
		}
		return tx.transfer.create({
			data: {
				transferNumber: data.transferNumber,
				sourceWarehouseId: data.sourceWarehouseId,
				destinationWarehouseId: data.destinationWarehouseId,
				items: { create: data.items },
			},
			include: { items: true },
		});
	}, { isolationLevel: "Serializable" });
}

async function dispatchTransfer(id, userId) {
	return prisma.$transaction(async (tx) => {
		const transfer = await tx.transfer.findUnique({ where: { id }, include: { items: true } });
		if (!transfer) throw error("Transfer not found", 404, "TRANSFER_NOT_FOUND");
		if (transfer.status !== "DRAFT") throw error("Only draft transfers can be dispatched", 400, "INVALID_TRANSFER_STATUS");
		for (const item of transfer.items) {
			await inventoryService.recordMovementInTransaction(tx, {
				variantId: item.variantId,
				locationId: item.sourceLocationId,
				type: MOVEMENT_TYPES.TRANSFER_OUT,
				quantity: item.quantity,
				referenceType: "TRANSFER",
				referenceId: transfer.id,
				idempotencyKey: `transfer:${transfer.id}:item:${item.id}:out`,
				createdById: userId,
			});
		}
		return tx.transfer.update({ where: { id }, data: { status: "IN_TRANSIT" }, include: { items: true } });
	}, { isolationLevel: "Serializable" });
}

async function receiveTransfer(id, requestedItems, userId) {
	return prisma.$transaction(async (tx) => {
		const transfer = await tx.transfer.findUnique({ where: { id }, include: { items: true } });
		if (!transfer) throw error("Transfer not found", 404, "TRANSFER_NOT_FOUND");
		if (transfer.status !== "IN_TRANSIT") throw error("Only in-transit transfers can be received", 400, "INVALID_TRANSFER_STATUS");
		const items = new Map(transfer.items.map((item) => [item.id, item]));
		for (const request of requestedItems) {
			const item = items.get(request.transferItemId);
			if (!item) throw error("Transfer item does not belong to this transfer", 400, "TRANSFER_ITEM_MISMATCH");
			if (request.receivedQuantity > item.quantity - item.receivedQuantity) {
				throw error("Received quantity exceeds remaining transfer quantity", 409, "TRANSFER_QUANTITY_EXCEEDED");
			}
			await inventoryService.recordMovementInTransaction(tx, {
				variantId: item.variantId,
				locationId: item.destinationLocationId,
				type: MOVEMENT_TYPES.TRANSFER_IN,
				quantity: request.receivedQuantity,
				referenceType: "TRANSFER",
				referenceId: transfer.id,
				idempotencyKey: `transfer:${transfer.id}:item:${item.id}:in:${item.receivedQuantity}:${request.receivedQuantity}`,
				createdById: userId,
			});
			await tx.transferItem.update({ where: { id: item.id }, data: { receivedQuantity: { increment: request.receivedQuantity } } });
		}
		const updatedItems = await tx.transferItem.findMany({ where: { transferId: id } });
		const complete = updatedItems.every((item) => item.receivedQuantity >= item.quantity);
		return tx.transfer.update({ where: { id }, data: { status: complete ? "COMPLETED" : "PARTIALLY_RECEIVED" }, include: { items: true } });
	}, { isolationLevel: "Serializable" });
}

async function getTransfer(id) {
	const transfer = await prisma.transfer.findUnique({ where: { id }, include: { items: true, sourceWarehouse: true, destinationWarehouse: true } });
	if (!transfer) throw error("Transfer not found", 404, "TRANSFER_NOT_FOUND");
	return transfer;
}

async function getTransfers(query = {}) {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
	const [items, total] = await prisma.$transaction([
		prisma.transfer.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { items: true, sourceWarehouse: true, destinationWarehouse: true } }),
		prisma.transfer.count(),
	]);
	return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { createTransfer, dispatchTransfer, receiveTransfer, getTransfer, getTransfers };
