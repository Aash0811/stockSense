const prisma = require("../../database/prisma");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createPurchaseOrder(data, userId) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({
      where: {
        id: data.supplierId,
      },
    });

    if (!supplier) {
      throw createError("Supplier not found", 404);
    }

    const warehouse = await tx.warehouse.findUnique({
      where: {
        id: data.warehouseId,
      },
    });

    if (!warehouse) {
      throw createError("Warehouse not found", 404);
    }

    if (!warehouse.isActive) {
      throw createError("Warehouse is inactive");
    }

    const existingPO = await tx.purchaseOrder.findUnique({
      where: {
        poNumber: data.poNumber,
      },
    });

    if (existingPO) {
      throw createError(
        "Purchase order number already exists",
        409
      );
    }

    const variantIds = [
      ...new Set(
        data.items.map((item) => item.variantId)
      ),
    ];

    const variants = await tx.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
        isActive: true,
      },
    });

    if (variants.length !== variantIds.length) {
      throw createError(
        "One or more product variants are invalid or inactive",
        400
      );
    }

    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        expectedDate: data.expectedDate || null,
        notes: data.notes || null,
        status: "DRAFT",
        createdById: userId,

        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: 0,
            unitCost: item.unitCost,
          })),
        },
      },

      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return purchaseOrder;
  });
}

async function getPurchaseOrders(query) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const where = {
    ...(query.status && {
      status: query.status,
    }),

    ...(query.supplierId && {
      supplierId: query.supplierId,
    }),

    ...(query.warehouseId && {
      warehouseId: query.warehouseId,
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.purchaseOrder.count({
      where,
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPurchaseOrderById(id) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id,
      },

      include: {
        supplier: true,
        warehouse: true,

        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },

        receipts: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!purchaseOrder) {
    throw createError(
      "Purchase order not found",
      404
    );
  }

  return purchaseOrder;
}

async function updatePurchaseOrderStatus(
  id,
  status
) {
  const purchaseOrder =
    await prisma.purchaseOrder.findUnique({
      where: {
        id,
      },
    });

  if (!purchaseOrder) {
    throw createError(
      "Purchase order not found",
      404
    );
  }

  const allowedTransitions = {
    DRAFT: ["SUBMITTED", "CANCELLED"],

    SUBMITTED: ["APPROVED", "CANCELLED"],

    APPROVED: ["ORDERED", "CANCELLED"],

    ORDERED: [],

    PARTIALLY_RECEIVED: [],

    RECEIVED: [],

    CLOSED: [],

    CANCELLED: [],
  };

  if (
    !allowedTransitions[purchaseOrder.status]?.includes(
      status
    )
  ) {
    throw createError(
      `Cannot change PO status from ${purchaseOrder.status} to ${status}`,
      409
    );
  }

  return prisma.purchaseOrder.update({
    where: {
      id,
    },

    data: {
      status,
    },

    include: {
      supplier: true,
      warehouse: true,
      items: true,
    },
  });
}

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
};