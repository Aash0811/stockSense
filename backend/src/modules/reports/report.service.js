const prisma = require("../../database/prisma");

async function getDashboard(query = {}) {
	const { warehouseId, categoryId } = query;

	const inventoryWhere = {};
	if (warehouseId) inventoryWhere.warehouseId = warehouseId;
	if (categoryId) {
		inventoryWhere.variant = {
			product: { categoryId },
		};
	}

	const receiptWhere = { status: { in: ["DRAFT", "PENDING", "WAITING"] } };
	if (warehouseId) receiptWhere.warehouseId = warehouseId;

	const deliveryWhere = { status: { in: ["DRAFT", "READY", "PICKING", "PACKED", "SHIPPED"] } };
	if (warehouseId) deliveryWhere.warehouseId = warehouseId;

	const transferWhere = { status: { in: ["DRAFT", "IN_TRANSIT", "PARTIALLY_RECEIVED"] } };
	if (warehouseId) {
		transferWhere.OR = [
			{ sourceWarehouseId: warehouseId },
			{ destinationWarehouseId: warehouseId },
		];
	}

	const [inventory, lowStock, pendingReceipts, pendingDeliveries, scheduledTransfers, recentMovements] = await Promise.all([
		prisma.inventory.findMany({
			where: inventoryWhere,
			select: { onHand: true, reserved: true, damaged: true, variantId: true },
		}),
		prisma.inventory.count({
			where: { ...inventoryWhere, onHand: { lte: 0 } },
		}),
		prisma.receipt.count({ where: receiptWhere }),
		prisma.delivery.count({ where: deliveryWhere }),
		prisma.transfer.count({ where: transferWhere }),
		prisma.stockMovement.findMany({
			where: warehouseId ? { warehouseId } : {},
			take: 5,
			orderBy: { createdAt: "desc" },
			include: {
				variant: { include: { product: true } },
				warehouse: true,
				createdBy: { select: { name: true } },
			},
		}),
	]);

	const totalProductsInStock = inventory.filter((item) => Number(item.onHand) > 0).length;
	const outOfStock = inventory.filter((item) => Number(item.onHand) <= 0).length;

	// Calculate Smart Insights for hackathon decision support
	const forecast = await getForecast();
	const lowStockCount = forecast.filter((f) => f.daysUntilStockout !== null && f.daysUntilStockout <= 7).length;
	const deadStock = await getDeadStock();
	const deadStockUnits = deadStock.reduce((sum, item) => sum + item.onHand, 0);
	const anomalies = await getAnomalies();

	const smartInsights = [
		lowStockCount > 0 ? {
			type: "WARNING",
			icon: "alert-triangle",
			title: `${lowStockCount} products may run out within 7 days`,
			description: "Daily demand indicates imminent stockouts without replenishment.",
			action: "/forecast",
		} : null,
		deadStockUnits > 0 ? {
			type: "INFO",
			icon: "archive",
			title: `${deadStockUnits} units identified as slow-moving or dead stock`,
			description: "Capital is tied up in low-turnover items. Consider discounting or redistributing.",
			action: "/reports",
		} : null,
		anomalies.length > 0 ? {
			type: "ALERT",
			icon: "shield-alert",
			title: `${anomalies.length} unusual stock adjustment${anomalies.length > 1 ? "s" : ""} detected`,
			description: "High variance counts flagged for audit review.",
			action: "/anomalies",
		} : null,
		pendingDeliveries > 0 ? {
			type: "SUCCESS",
			icon: "check-circle",
			title: `${pendingDeliveries} delivery orders ready for fulfillment`,
			description: "Use smart warehouse routing to pick with maximum efficiency.",
			action: "/deliveries",
		} : null,
	].filter(Boolean);

	return {
		totalProductsInStock,
		lowStock,
		outOfStock,
		pendingReceipts,
		pendingDeliveries,
		scheduledTransfers,
		smartInsights,
		recentMovements,
	};
}

async function getForecast() {
	const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const [inventory, movements] = await Promise.all([
		prisma.inventory.findMany({ include: { variant: { include: { product: true } }, location: true, warehouse: true } }),
		prisma.stockMovement.findMany({ where: { type: "DELIVERY", createdAt: { gte: since } }, select: { variantId: true, quantity: true } }),
	]);

	const demand = new Map();
	for (const movement of movements) demand.set(movement.variantId, (demand.get(movement.variantId) || 0) + movement.quantity);

	return inventory.map((item) => {
		const dailyDemand = (demand.get(item.variantId) || 0) / 30;
		const available = Math.max(0, Number(item.onHand) - Number(item.reserved) - Number(item.damaged));
		const daysUntilStockout = dailyDemand > 0 ? Math.floor(available / dailyDemand) : null;
		const reorderPoint = Number(item.variant.product.reorderPoint) || 0;
		return {
			variantId: item.variantId,
			product: item.variant.product.name,
			sku: item.variant.sku,
			warehouse: item.warehouse.name,
			location: item.location.code,
			unit: item.variant.product.unitName,
			onHand: item.onHand,
			available,
			dailyDemand: Number(dailyDemand.toFixed(2)),
			daysUntilStockout,
			reorderPoint,
			reorderRecommended: available <= reorderPoint,
			urgency: daysUntilStockout !== null && daysUntilStockout <= 3 ? "CRITICAL" : daysUntilStockout !== null && daysUntilStockout <= 7 ? "HIGH" : available <= reorderPoint ? "MEDIUM" : "LOW",
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

	return movements.filter((movement) => {
		if (movement.type === "ADJUSTMENT") return true;
		const avg = (totals.get(movement.variantId) || movement.quantity) / Math.max(movements.length, 1);
		return movement.quantity > avg * 3 && movement.quantity > 50;
	}).map((movement) => ({
		id: movement.id,
		type: movement.type,
		quantity: movement.quantity,
		product: movement.variant?.product?.name || "Product",
		sku: movement.variant?.sku || "-",
		warehouse: movement.warehouse?.name || "Warehouse",
		createdBy: movement.createdBy?.name || "System",
		createdAt: movement.createdAt,
		reason: movement.reason || "Manual adjustment",
		severity: movement.quantity >= 100 ? "HIGH" : "MEDIUM",
	}));
}

async function getDeadStock() {
	const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
	const [inventoryItems, deliveries] = await Promise.all([
		prisma.inventory.findMany({
			where: { onHand: { gt: 0 } },
			include: {
				variant: { include: { product: { include: { category: true } } } },
				warehouse: true,
				location: true,
			},
		}),
		prisma.stockMovement.findMany({
			where: { type: "DELIVERY", createdAt: { gte: since } },
			select: { variantId: true, quantity: true, createdAt: true },
		}),
	]);

	const salesMap = new Map();
	for (const d of deliveries) {
		salesMap.set(d.variantId, (salesMap.get(d.variantId) || 0) + d.quantity);
	}

	return inventoryItems
		.filter((inv) => {
			const sold = salesMap.get(inv.variantId) || 0;
			return sold <= 5; // Low velocity in 90 days
		})
		.map((inv) => {
			const sold = salesMap.get(inv.variantId) || 0;
			const unitCost = Number(inv.variant.cost) || 10;
			const lockedCapital = inv.onHand * unitCost;
			let recommendation = "Monitor usage pattern";
			if (sold === 0) recommendation = "Dead stock: discount 25% or bundle with popular product";
			else if (inv.onHand > 100) recommendation = "Overstocked: pause reordering and transfer surplus";

			return {
				id: inv.id,
				variantId: inv.variantId,
				productName: inv.variant.product.name,
				sku: inv.variant.sku,
				category: inv.variant.product.category?.name || "General",
				warehouse: inv.warehouse.name,
				location: inv.location.code,
				onHand: inv.onHand,
				sold90Days: sold,
				unitCost,
				lockedCapital,
				recommendation,
			};
		});
}

async function getExplainability(query = {}) {
	const { variantId, days = 7 } = query;

	let targetVariantId = variantId;
	if (!targetVariantId) {
		const firstVariant = await prisma.productVariant.findFirst({
			where: { isActive: true },
			include: { product: true },
		});
		if (firstVariant) targetVariantId = firstVariant.id;
	}

	if (!targetVariantId) {
		return { error: "No product variants available to explain." };
	}

	const variant = await prisma.productVariant.findUnique({
		where: { id: targetVariantId },
		include: {
			product: true,
			inventory: { include: { location: true, warehouse: true } },
		},
	});

	if (!variant) throw new Error("Variant not found");

	const currentOnHand = variant.inventory.reduce((sum, inv) => sum + Number(inv.onHand), 0);
	const currentReserved = variant.inventory.reduce((sum, inv) => sum + Number(inv.reserved), 0);
	const currentDamaged = variant.inventory.reduce((sum, inv) => sum + Number(inv.damaged), 0);
	const currentAvailable = Math.max(0, currentOnHand - currentReserved - currentDamaged);

	const sinceDate = new Date(Date.now() - (Number(days) || 7) * 24 * 60 * 60 * 1000);

	const movements = await prisma.stockMovement.findMany({
		where: {
			variantId: targetVariantId,
			createdAt: { gte: sinceDate },
		},
		include: {
			location: true,
			warehouse: true,
			createdBy: { select: { name: true } },
		},
		orderBy: { createdAt: "desc" },
	});

	let receiptsQty = 0;
	let deliveriesQty = 0;
	let transfersInQty = 0;
	let transfersOutQty = 0;
	let adjustmentsNetQty = 0;
	let damagedQty = 0;

	for (const m of movements) {
		const qty = Number(m.quantity) || 0;
		if (m.type === "RECEIPT") receiptsQty += qty;
		else if (m.type === "DELIVERY") deliveriesQty += qty;
		else if (m.type === "TRANSFER_IN") transfersInQty += qty;
		else if (m.type === "TRANSFER_OUT") transfersOutQty += qty;
		else if (m.type === "ADJUSTMENT") {
			adjustmentsNetQty += (m.reason?.toLowerCase().includes("decrease") || m.reason?.toLowerCase().includes("damaged") || m.reason?.toLowerCase().includes("theft")) ? -qty : qty;
		}
		if (m.reason?.toLowerCase().includes("damaged") || m.type === "WRITE_OFF") {
			damagedQty += qty;
		}
	}

	const netChange = receiptsQty - deliveriesQty + transfersInQty - transfersOutQty + adjustmentsNetQty;
	const openingStock = Math.max(0, currentOnHand - netChange);

	const unit = variant.product.unitName || "units";
	const narrative = `${variant.product.name} started at ${openingStock} ${unit} ${days} days ago and is now at ${currentOnHand} ${unit} (Net change: ${netChange >= 0 ? "+" : ""}${netChange} ${unit}). Breakdown: +${receiptsQty} received, -${deliveriesQty} delivered to customers, +${transfersInQty} / -${transfersOutQty} transferred, and ${adjustmentsNetQty >= 0 ? "+" : ""}${adjustmentsNetQty} adjusted.`;

	return {
		product: {
			id: variant.product.id,
			name: variant.product.name,
			sku: variant.sku,
			unit,
			brand: variant.product.brand,
		},
		metrics: {
			openingStock,
			currentOnHand,
			currentReserved,
			currentDamaged,
			currentAvailable,
			netChange,
			daysAnalyzed: Number(days) || 7,
		},
		breakdown: {
			receipts: { total: receiptsQty, count: movements.filter((m) => m.type === "RECEIPT").length },
			deliveries: { total: deliveriesQty, count: movements.filter((m) => m.type === "DELIVERY").length },
			transfersIn: { total: transfersInQty, count: movements.filter((m) => m.type === "TRANSFER_IN").length },
			transfersOut: { total: transfersOutQty, count: movements.filter((m) => m.type === "TRANSFER_OUT").length },
			adjustments: { total: adjustmentsNetQty, count: movements.filter((m) => m.type === "ADJUSTMENT").length },
			damaged: { total: damagedQty },
		},
		narrative,
		timeline: movements.map((m) => ({
			id: m.id,
			time: m.createdAt,
			type: m.type,
			quantity: m.quantity,
			location: m.location?.code || "-",
			warehouse: m.warehouse?.name || "-",
			actor: m.createdBy?.name || "Staff",
			reason: m.reason || m.referenceType || "Standard movement",
		})),
	};
}

async function getNotifications() {
	const inventory = await prisma.inventory.findMany({ include: { variant: { include: { product: true } }, location: true, warehouse: true } });
	return inventory.filter((item) => {
		const available = Number(item.onHand) - Number(item.reserved) - Number(item.damaged);
		return available <= Number(item.variant.product.reorderPoint) || Number(item.damaged) > 0;
	}).map((item) => {
		const available = Math.max(0, Number(item.onHand) - Number(item.reserved) - Number(item.damaged));
		return {
			id: item.id,
			severity: available <= 0 ? "critical" : available <= 10 ? "warning" : "info",
			type: available <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
			message: `${item.variant.product.name} (${item.variant.sku}) at ${item.warehouse.name} [${item.location.code}] has ${available} available ${item.variant.product.unitName}`,
			available,
			reorderPoint: item.variant.product.reorderPoint,
			warehouse: item.warehouse.name,
		};
	});
}

async function answerAssistant(question) {
	const normalized = question.toLowerCase();

	if (normalized.includes("7 days") || normalized.includes("run out") || normalized.includes("forecast") || normalized.includes("reorder")) {
		const forecast = await getForecast();
		const critical = forecast.filter((item) => item.daysUntilStockout !== null && item.daysUntilStockout <= 7);
		return {
			answer: critical.length > 0
				? `⚠️ ${critical.length} product(s) are projected to run out in the next 7 days based on recent demand:`
				: "✓ All products currently have more than 7 days of stock runway.",
			data: critical.length > 0 ? critical : forecast.filter((f) => f.reorderRecommended),
		};
	}

	if (normalized.includes("dead") || normalized.includes("slow")) {
		const deadStock = await getDeadStock();
		return {
			answer: `Found ${deadStock.length} slow-moving inventory items with capital locked up. Here are the recommendations:`,
			data: deadStock,
		};
	}

	if (normalized.includes("why") || normalized.includes("change") || normalized.includes("explain")) {
		const explain = await getExplainability({});
		return {
			answer: explain.narrative,
			data: explain,
		};
	}

	if (normalized.includes("anomal") || normalized.includes("unusual") || normalized.includes("suspicious")) {
		const anomalies = await getAnomalies();
		return {
			answer: `Detected ${anomalies.length} unusual adjustment(s) or abnormal quantity movements requiring attention:`,
			data: anomalies,
		};
	}

	if (normalized.includes("low") || normalized.includes("alert")) {
		return {
			answer: "Here are the current low-stock and out-of-stock inventory alerts across your warehouses:",
			data: await getNotifications(),
		};
	}

	if (normalized.includes("deliver")) {
		const deliveries = await prisma.delivery.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
			include: { warehouse: true, items: { include: { variant: { include: { product: true } } } } },
		});
		return {
			answer: "Here are the latest customer delivery orders:",
			data: deliveries,
		};
	}

	return {
		answer: "I can help explain stock changes, forecast stockouts in 7 days, detect slow-moving dead stock, find unusual adjustments, and check alerts.",
		data: await getNotifications(),
	};
}

module.exports = {
	getDashboard,
	getForecast,
	getAnomalies,
	getDeadStock,
	getExplainability,
	getNotifications,
	answerAssistant,
};
