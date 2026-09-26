const prisma = require("../../database/prisma");

const {
  recordMovementInTransaction,
  updateDamagedStock,
} = require("../inventory/inventory.service");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createReceipt(data, userId) {
  const {
    receiptNumber,
    purchaseOrderId,
    warehouseId,
    status = "RECEIVED",
    items,
    notes,
  } = data;

  let purchaseOrder = null;
  if (purchaseOrderId) {
    purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status)) {
      throw new Error("Purchase order cannot receive stock in its current status");
    }

    if (purchaseOrder.warehouseId !== warehouseId) {
      throw new Error("Receipt warehouse does not match purchase order warehouse");
    }

    for (const item of items) {
      if (item.purchaseOrderItemId) {
        const poItem = purchaseOrder.items.find((entry) => entry.id === item.purchaseOrderItemId);
        if (!poItem) throw new Error(`Purchase order item ${item.purchaseOrderItemId} not found`);
        if (poItem.variantId !== item.variantId) throw new Error("Receipt variant does not match purchase order item");
        const remaining = Number(poItem.orderedQuantity) - Number(poItem.receivedQuantity);
        if (item.receivedQuantity > remaining) {
          throw new Error(`Received quantity exceeds remaining quantity for purchase order item ${poItem.id}`);
        }
      }
      if (item.damagedQuantity > item.receivedQuantity) {
        throw new Error("Damaged quantity cannot exceed received quantity");
      }
    }
  }

  const isDraft = status === "DRAFT" || status === "WAITING";

  return prisma.$transaction(
    async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: purchaseOrderId || null,
          warehouseId,
          status: isDraft ? "DRAFT" : "RECEIVED",
          expectedQuantity: items.reduce((sum, i) => sum + (Number(i.receivedQuantity) || 0), 0),
          receivedQuantity: isDraft ? 0 : items.reduce((sum, i) => sum + (Number(i.receivedQuantity) || 0), 0),
          damagedQuantity: isDraft ? 0 : items.reduce((sum, i) => sum + (Number(i.damagedQuantity) || 0), 0),
        },
      });

      for (const item of items) {
        await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            variantId: item.variantId,
            locationId: item.locationId,
            quantity: item.receivedQuantity,
            damagedQuantity: item.damagedQuantity || 0,
          },
        });

        if (!isDraft) {
          await recordMovementInTransaction(tx, {
            variantId: item.variantId,
            locationId: item.locationId,
            type: "RECEIPT",
            quantity: item.receivedQuantity,
            referenceType: "RECEIPT",
            referenceId: receipt.id,
            idempotencyKey: `receipt:${receipt.id}:item:${item.variantId}:${item.locationId}`,
            reason: notes || (purchaseOrder ? `PO #${purchaseOrder.orderNumber} Receipt` : "Direct goods receipt"),
            createdById: userId,
          });

          if (item.damagedQuantity > 0) {
            await updateDamagedStock(tx, {
              variantId: item.variantId,
              locationId: item.locationId,
              quantity: item.damagedQuantity,
            });
          }

          if (item.purchaseOrderItemId) {
            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: { receivedQuantity: { increment: item.receivedQuantity } },
            });
          }
        }
      }

      if (!isDraft && purchaseOrderId) {
        const updatedPO = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId },
          include: { items: true },
        });

        const allReceived = updatedPO.items.every(
          (item) => Number(item.receivedQuantity) >= Number(item.orderedQuantity)
        );
        const someReceived = updatedPO.items.some(
          (item) => Number(item.receivedQuantity) > 0
        );

        let nextStatus = updatedPO.status;
        if (allReceived) nextStatus = "RECEIVED";
        else if (someReceived) nextStatus = "PARTIALLY_RECEIVED";

        if (nextStatus !== updatedPO.status) {
          await tx.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: { status: nextStatus },
          });
        }
      }

      return tx.receipt.findUnique({
        where: { id: receipt.id },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
              location: true,
            },
          },
          purchaseOrder: true,
          warehouse: true,
        },
      });
    },
    { isolationLevel: "Serializable" }
  );
}

async function validateReceipt(id, userId) {
  return prisma.$transaction(
    async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id },
        include: { items: true, purchaseOrder: { include: { items: true } } },
      });

      if (!receipt) throw createError("Receipt not found", 404);
      if (receipt.status !== "DRAFT" && receipt.status !== "WAITING") {
        throw createError("Only draft or waiting receipts can be validated", 400);
      }

      let totalReceived = 0;
      let totalDamaged = 0;

      for (const item of receipt.items) {
        totalReceived += item.quantity;
        totalDamaged += item.damagedQuantity;

        await recordMovementInTransaction(tx, {
          variantId: item.variantId,
          locationId: item.locationId,
          type: "RECEIPT",
          quantity: item.quantity,
          referenceType: "RECEIPT",
          referenceId: receipt.id,
          idempotencyKey: `receipt:${receipt.id}:validate:${item.id}`,
          reason: "Validated Goods Receipt",
          createdById: userId,
        });

        if (item.damagedQuantity > 0) {
          await updateDamagedStock(tx, {
            variantId: item.variantId,
            locationId: item.locationId,
            quantity: item.damagedQuantity,
          });
        }
      }

      return tx.receipt.update({
        where: { id },
        data: {
          status: "RECEIVED",
          receivedQuantity: totalReceived,
          damagedQuantity: totalDamaged,
        },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
              location: true,
            },
          },
          warehouse: true,
          purchaseOrder: true,
        },
      });
    },
    { isolationLevel: "Serializable" }
  );
}

async function getReceipts(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const where = {};
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.status) where.status = query.status;

  const [items, total] = await prisma.$transaction([
    prisma.receipt.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            location: true,
          },
        },
        purchaseOrder: true,
        warehouse: true,
      },
    }),
    prisma.receipt.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getReceiptById(id) {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
          location: true,
        },
      },
      purchaseOrder: { include: { items: true } },
      warehouse: true,
    },
  });
  if (!receipt) throw createError("Receipt not found", 404);
  return receipt;
}

module.exports = {
  createReceipt,
  validateReceipt,
  getReceipts,
  getReceiptById,
};