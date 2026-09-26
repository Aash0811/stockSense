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
    items,
    notes,
  } = data;

  // Keep all validation BEFORE the transaction where possible.
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      id: purchaseOrderId,
    },
    include: {
      items: true,
    },
  });

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (
    !["ORDERED", "PARTIALLY_RECEIVED"].includes(
      purchaseOrder.status
    )
  ) {
    throw new Error(
      "Purchase order cannot receive stock in its current status"
    );
  }

  if (purchaseOrder.warehouseId !== warehouseId) {
    throw new Error(
      "Receipt warehouse does not match purchase order warehouse"
    );
  }

  // Validate every receipt line before changing anything.
  for (const item of items) {
    const poItem = purchaseOrder.items.find(
      (entry) => entry.id === item.purchaseOrderItemId
    );

    if (!poItem) {
      throw new Error(
        `Purchase order item ${item.purchaseOrderItemId} not found`
      );
    }

    if (poItem.variantId !== item.variantId) {
      throw new Error(
        "Receipt variant does not match purchase order item"
      );
    }

    const remaining =
      Number(poItem.orderedQuantity) -
      Number(poItem.receivedQuantity);

    if (item.receivedQuantity > remaining) {
      throw new Error(
        `Received quantity exceeds remaining quantity for purchase order item ${poItem.id}`
      );
    }

    if (item.damagedQuantity > item.receivedQuantity) {
      throw new Error(
        "Damaged quantity cannot exceed received quantity"
      );
    }
  }

  return prisma.$transaction(
    async (tx) => {
      // --------------------------------------------------
      // 1. Create receipt
      // --------------------------------------------------

      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          purchaseOrderId,
          warehouseId,
          status: "RECEIVED",
          receivedAt: new Date(),
          createdById: userId,
          notes,
        },
      });

      // --------------------------------------------------
      // 2. Process each receipt line
      // --------------------------------------------------

      for (const item of items) {
        await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            purchaseOrderItemId: item.purchaseOrderItemId,
            variantId: item.variantId,
            locationId: item.locationId,
            receivedQuantity: item.receivedQuantity,
            damagedQuantity: item.damagedQuantity,
          },
        });

        // ------------------------------------------------
        // 3. Create stock ledger movement
        // ------------------------------------------------

        await recordMovementInTransaction(tx, {
          variantId: item.variantId,
          locationId: item.locationId,
          type: "RECEIPT",
          quantity: item.receivedQuantity,
          referenceType: "RECEIPT",
          referenceId: receipt.id,
          idempotencyKey:
            `receipt:${receipt.id}:item:${item.purchaseOrderItemId}`,
          reason: "Purchase order receipt",
          createdById: userId,
        });

        // ------------------------------------------------
        // 4. Record damaged portion
        // ------------------------------------------------

        if (item.damagedQuantity > 0) {
          await updateDamagedStock(tx, {
            variantId: item.variantId,
            locationId: item.locationId,
            quantity: item.damagedQuantity,
          });
        }

        // ------------------------------------------------
        // 5. Update PO received quantity
        // ------------------------------------------------

        await tx.purchaseOrderItem.update({
          where: {
            id: item.purchaseOrderItemId,
          },
          data: {
            receivedQuantity: {
              increment: item.receivedQuantity,
            },
          },
        });
      }

      // --------------------------------------------------
      // 6. Reload PO items after updates
      // --------------------------------------------------

      const updatedPO = await tx.purchaseOrder.findUnique({
        where: {
          id: purchaseOrderId,
        },
        include: {
          items: true,
        },
      });

      // --------------------------------------------------
      // 7. Calculate PO status
      // --------------------------------------------------

      const allReceived = updatedPO.items.every(
        (item) =>
          Number(item.receivedQuantity) >=
          Number(item.orderedQuantity)
      );

      const someReceived = updatedPO.items.some(
        (item) => Number(item.receivedQuantity) > 0
      );

      let nextStatus = updatedPO.status;

      if (allReceived) {
        nextStatus = "RECEIVED";
      } else if (someReceived) {
        nextStatus = "PARTIALLY_RECEIVED";
      }

      if (nextStatus !== updatedPO.status) {
        await tx.purchaseOrder.update({
          where: {
            id: purchaseOrderId,
          },
          data: {
            status: nextStatus,
          },
        });
      }

      // --------------------------------------------------
      // 8. Return complete receipt
      // --------------------------------------------------

      return tx.receipt.findUnique({
        where: {
          id: receipt.id,
        },
        include: {
          items: true,
          purchaseOrder: {
            include: {
              items: true,
            },
          },
        },
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );
}

async function getReceipts(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const [items, total] = await prisma.$transaction([
    prisma.receipt.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { items: true, purchaseOrder: true, warehouse: true } }),
    prisma.receipt.count(),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getReceiptById(id) {
  const receipt = await prisma.receipt.findUnique({ where: { id }, include: { items: true, purchaseOrder: { include: { items: true } }, warehouse: true } });
  if (!receipt) throw createError("Receipt not found", 404);
  return receipt;
}
module.exports = {
  createReceipt,
  getReceipts,
  getReceiptById,
};