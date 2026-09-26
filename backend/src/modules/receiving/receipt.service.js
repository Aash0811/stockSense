const { prisma } = require("../../database/prisma");

const {
  recordMovement,
} = require("../inventory/inventory.service");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createReceipt(data, userId) {
  /*
   * We need the PO and all validation to happen
   * before changing stock.
   */
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id: data.purchaseOrderId,
      },

      include: {
        items: true,
      },
    });

  if (!purchaseOrder) {
    throw createError(
      "Purchase order not found",
      404
    );
  }

  if (
    ![
      "ORDERED",
      "PARTIALLY_RECEIVED",
    ].includes(purchaseOrder.status)
  ) {
    throw createError(
      `Purchase order cannot be received while in ${purchaseOrder.status} status`,
      409
    );
  }

  if (
    purchaseOrder.warehouseId !== data.warehouseId
  ) {
    throw createError(
      "Receipt warehouse does not match purchase order warehouse",
      400
    );
  }

  /*
   * Validate all receipt lines.
   */
  for (const item of data.items) {
    const poItem = purchaseOrder.items.find(
      (entry) =>
        entry.id === item.purchaseOrderItemId
    );

    if (!poItem) {
      throw createError(
        "Purchase order item not found",
        404
      );
    }

    if (poItem.variantId !== item.variantId) {
      throw createError(
        "Receipt variant does not match purchase order item",
        400
      );
    }

    const remaining =
      Number(poItem.orderedQuantity) -
      Number(poItem.receivedQuantity);

    if (item.receivedQuantity > remaining) {
      throw createError(
        `Cannot receive ${item.receivedQuantity}. Remaining quantity is ${remaining}`,
        409
      );
    }

    if (
      item.damagedQuantity >
      item.receivedQuantity
    ) {
      throw createError(
        "Damaged quantity cannot exceed received quantity",
        400
      );
    }
  }

  /*
   * Create the receipt first.
   */
  const receipt = await prisma.$transaction(
    async (tx) => {
      const existingReceipt =
        await tx.receipt.findUnique({
          where: {
            receiptNumber: data.receiptNumber,
          },
        });

      if (existingReceipt) {
        throw createError(
          "Receipt number already exists",
          409
        );
      }

      const receipt =
        await tx.receipt.create({
          data: {
            receiptNumber:
              data.receiptNumber,

            purchaseOrderId:
              data.purchaseOrderId,

            warehouseId:
              data.warehouseId,

            status: "RECEIVED",

            receivedAt: new Date(),

            createdById: userId,

            items: {
              create: data.items.map(
                (item) => ({
                  purchaseOrderItemId:
                    item.purchaseOrderItemId,

                  variantId:
                    item.variantId,

                  locationId:
                    item.locationId,

                  receivedQuantity:
                    item.receivedQuantity,

                  damagedQuantity:
                    item.damagedQuantity,

                  notes:
                    item.notes || null,
                })
              ),
            },
          },

          include: {
            items: true,
          },
        });

      return receipt;
    }
  );

  /*
   * Now apply stock movements.
   *
   * Good quantity goes into onHand.
   */
  for (const item of data.items) {
    const goodQuantity =
      item.receivedQuantity -
      item.damagedQuantity;

    if (goodQuantity > 0) {
      await recordMovement({
        variantId: item.variantId,

        locationId: item.locationId,

        type: "RECEIPT",

        quantity: goodQuantity,

        referenceType: "RECEIPT",

        referenceId: receipt.id,

        idempotencyKey:
          `receipt:${receipt.id}:item:${item.purchaseOrderItemId}`,

        reason: "Purchase order receipt",

        createdById: userId,
      });
    }

    /*
     * Damaged stock is recorded separately.
     *
     * It is physically received, but should not
     * become available stock.
     */
    if (item.damagedQuantity > 0) {
      await prisma.inventory.update({
        where: {
          variantId_locationId: {
            variantId: item.variantId,
            locationId: item.locationId,
          },
        },

        data: {
          damaged: {
            increment:
              item.damagedQuantity,
          },
        },
      });
    }
  }

  /*
   * Update PO received quantities and status.
   */
  await prisma.$transaction(
    async (tx) => {
      for (const item of data.items) {
        await tx.purchaseOrderItem.update({
          where: {
            id: item.purchaseOrderItemId,
          },

          data: {
            receivedQuantity: {
              increment:
                item.receivedQuantity,
            },
          },
        });
      }

      const updatedPO =
        await tx.purchaseOrder.findUnique({
          where: {
            id: purchaseOrder.id,
          },

          include: {
            items: true,
          },
        });

      const allReceived =
        updatedPO.items.every(
          (item) =>
            Number(item.receivedQuantity) >=
            Number(item.orderedQuantity)
        );

      const someReceived =
        updatedPO.items.some(
          (item) =>
            Number(item.receivedQuantity) > 0
        );

      let status =
        updatedPO.status;

      if (allReceived) {
        status = "RECEIVED";
      } else if (someReceived) {
        status = "PARTIALLY_RECEIVED";
      }

      if (status !== updatedPO.status) {
        await tx.purchaseOrder.update({
          where: {
            id: updatedPO.id,
          },

          data: {
            status,
          },
        });
      }
    }
  );

  return prisma.receipt.findUnique({
    where: {
      id: receipt.id,
    },

    include: {
      purchaseOrder: true,
      warehouse: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
          location: true,
        },
      },
    },
  });
}

async function getReceipts(query) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const where = {
    ...(query.purchaseOrderId && {
      purchaseOrderId:
        query.purchaseOrderId,
    }),

    ...(query.warehouseId && {
      warehouseId: query.warehouseId,
    }),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.receipt.findMany({
        where,

        include: {
          purchaseOrder: true,
          warehouse: true,
          items: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        skip: (page - 1) * limit,

        take: limit,
      }),

      prisma.receipt.count({
        where,
      }),
    ]);

  return {
    items,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
    },
  };
}

async function getReceiptById(id) {
  const receipt =
    await prisma.receipt.findUnique({
      where: {
        id,
      },

      include: {
        purchaseOrder: true,
        warehouse: true,

        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },

            location: true,
          },
        },
      },
    });

  if (!receipt) {
    throw createError(
      "Receipt not found",
      404
    );
  }

  return receipt;
}

module.exports = {
  createReceipt,
  getReceipts,
  getReceiptById,
};