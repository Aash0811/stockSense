const prisma = require("../../database/prisma");

async function getDashboard() {
	const [inventory, lowStock, pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
		prisma.inventory.findMany({ select: { onHand: true, reserved: true, damaged: true } }),
		prisma.inventory.count({ where: { onHand: { lte: 0 } } }),
		prisma.receipt.count({ where: { status: { in: ["DRAFT", "PENDING"] } } }),
		prisma.delivery.count({ where: { status: { in: ["DRAFT", "READY", "PICKING", "PACKED", "SHIPPED"] } } }),
		prisma.transfer.count({ where: { status: { in: ["DRAFT", "IN_TRANSIT", "PARTIALLY_RECEIVED"] } } }),
	]);

	const totalProductsInStock = inventory.filter((item) => Number(item.onHand) > 0).length;
	const outOfStock = inventory.filter((item) => Number(item.onHand) <= 0).length;

	return {
		totalProductsInStock,
		lowStock,
		outOfStock,
		pendingReceipts,
		pendingDeliveries,
		scheduledTransfers,
	};
}

async function getForecast() {

	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const [inventory, movements] = await Promise.all([
		prisma.inventory.findMany({ include: { variant: { include: { product: true } }, location: true } }),
		prisma.stockMovement.findMany({ where: { type: "DELIVERY", createdAt: { gte: since } }, select: { variantId: true, quantity: true } }),
	]);

	const demand = new Map();
	for (const movement of movements) demand.set(movement.variantId, (demand.get(movement.variantId) || 0) + movement.quantity);

	return inventory.map((item) => {
		const dailyDemand = (demand.get(item.variantId) || 0) / 30;
		const available = Number(item.onHand) - Number(item.reserved) - Number(item.damaged);
		return {
			variantId: item.variantId,
			product: item.variant.product.name,
			sku: item.variant.sku,
			location: item.location.code,
			available,
			dailyDemand: Number(dailyDemand.toFixed(2)),
			daysUntilStockout: dailyDemand ? Math.floor(available / dailyDemand) : null,
			reorderPoint: Number(item.variant.product.reorderPoint),
			reorderRecommended: available <= Number(item.variant.product.reorderPoint),
		};
	});
}

async function getAnomalies() {
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const movements = await prisma.stockMovement.findMany({
		where: { createdAt: { gte: since } },
		include: { variant: { include: { product: true } }, warehouse: true, createdBy: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	const totals = new Map();
	for (const movement of movements) totals.set(movement.variantId, (totals.get(movement.variantId) || 0) + movement.quantity);
	return movements.filter((movement) => movement.type === "ADJUSTMENT" || movement.quantity > (totals.get(movement.variantId) || movement.quantity) / Math.max(movements.length, 1) * 3).map((movement) => ({
		id: movement.id,
		type: movement.type,
		quantity: movement.quantity,
		product: movement.variant.product.name,
		warehouse: movement.warehouse.name,
		createdBy: movement.createdBy.name,
		createdAt: movement.createdAt,
		reason: movement.reason,
	}));
}

async function getNotifications() {
	const inventory = await prisma.inventory.findMany({ include: { variant: { include: { product: true } }, location: true } });
	return inventory.filter((item) => {
		const available = Number(item.onHand) - Number(item.reserved) - Number(item.damaged);
		return available <= Number(item.variant.product.reorderPoint) || Number(item.damaged) > 0;
	}).map((item) => {
		const available = Number(item.onHand) - Number(item.reserved) - Number(item.damaged);
		return {
			id: item.id,
			severity: available <= 0 ? "critical" : "warning",
			type: available <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
			message: `${item.variant.product.name} at ${item.location.code} has ${available} available units`,
		};
	});
}

async function answerAssistant(question) {
	const normalized = question.toLowerCase();
	if (normalized.includes("low") || normalized.includes("stock")) {
		return { answer: "Here are the current stock alerts.", data: await getNotifications() };
	}
	if (normalized.includes("reorder") || normalized.includes("forecast")) {
		return { answer: "These items are at or below their reorder point.", data: (await getForecast()).filter((item) => item.reorderRecommended) };
	}
	if (normalized.includes("anomal")) return { answer: "Recent unusual movement activity.", data: await getAnomalies() };
	if (normalized.includes("deliver")) return { answer: "Recent delivery movements.", data: await prisma.stockMovement.findMany({ where: { type: "DELIVERY" }, orderBy: { createdAt: "desc" }, take: 20 }) };
	return { answer: "I can answer questions about low stock, reorder recommendations, anomalies, and deliveries.", data: [] };
}

module.exports = { getDashboard, getForecast, getAnomalies, getNotifications, answerAssistant };
