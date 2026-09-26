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

module.exports = { getDashboard };
