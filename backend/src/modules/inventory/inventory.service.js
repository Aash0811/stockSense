const prisma = require("../../database/prisma");

const {
  MOVEMENT_TYPES,
  POSITIVE_MOVEMENT_TYPES,
  NEGATIVE_MOVEMENT_TYPES,
} = require("./inventory.constants");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/*
 * Verify the variant exists and is active.
 */
async function ensureVariant(tx, variantId) {
  const variant = await tx.productVariant.findUnique({
    where: {
      id: variantId,
    },
    include: {
      product: true,
    },
  });

  if (!variant) {
    throw createError("Product variant not found", 404);
  }

  if (!variant.isActive) {
    throw createError("Product variant is inactive", 400);
  }

  if (variant.product.status === "ARCHIVED") {
    throw createError(
      "Cannot modify inventory for an archived product",
      400
    );
  }

  return variant;
}

/*
 * Verify location and obtain its warehouse.
 */
async function ensureLocation(tx, locationId) {
  const location = await tx.location.findUnique({
    where: {
      id: locationId,
    },
  });

  if (!location) {
    throw createError("Location not found", 404);
  }

  if (!location.isActive) {
    throw createError("Location is inactive", 400);
  }

  return location;
}

/*
 * Create the inventory row if it does not exist.
 *
 * Inventory is identified by:
 *
 * variant + location
 *
 * Warehouse is derived from the location.
 */
async function getOrCreateInventory(
  tx,
  variantId,
  locationId
) {
  const location = await ensureLocation(tx, locationId);

  const existing = await tx.inventory.findUnique({
    where: {
      variantId_locationId: {
        variantId,
        locationId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  return tx.inventory.create({
    data: {
      variantId,
      warehouseId: location.warehouseId,
      locationId,
      onHand: 0,
      reserved: 0,
      damaged: 0,
      inTransit: 0,
    },
  });
}

async function updateDamagedStock(
  tx,
  { variantId, locationId, quantity }
) {
  if (quantity <= 0) {
    return null;
  }

  const inventory = await getOrCreateInventory(tx, {
    variantId,
    locationId,
  });

  return tx.inventory.update({
    where: {
      id: inventory.id,
    },
    data: {
      damaged: {
        increment: quantity,
      },
    },
  });
}
/*
 * Calculate available stock.
 *
 * Available =
 * On Hand - Reserved - Damaged
 */
function calculateAvailable(inventory) {
  return (
    Number(inventory.onHand) -
    Number(inventory.reserved) -
    Number(inventory.damaged)
  );
}

/*
 * Core stock mutation.
 *
 * IMPORTANT:
 * Controllers must not directly change inventory quantities.
 *
 * All stock-changing operations should eventually call this method.
 */
async function applyStockMovement(tx, data) {
  const {
    variantId,
    locationId,
    type,
    quantity,
    referenceType = null,
    referenceId = null,
    reason = null,
    idempotencyKey = null,
    createdById,
    direction = "INCREASE",
  } = data;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw createError(
      "Movement quantity must be greater than zero",
      400
    );
  }

  await ensureVariant(tx, variantId);

  const location = await ensureLocation(tx, locationId);

  /*
   * Idempotency protection.
   *
   * If the same movement key was already processed,
   * return the existing movement instead of applying it twice.
   */
  if (idempotencyKey) {
    const existingMovement =
      await tx.stockMovement.findUnique({
        where: {
          idempotencyKey,
        },
      });

    if (existingMovement) {
      return {
        movement: existingMovement,
        inventory: await tx.inventory.findUnique({
          where: {
            variantId_locationId: {
              variantId,
              locationId,
            },
          },
        }),
        alreadyProcessed: true,
      };
    }
  }

  const inventory = await getOrCreateInventory(
    tx,
    variantId,
    locationId
  );

  let newOnHand = Number(inventory.onHand);
  let newInTransit = Number(inventory.inTransit);

  const isNegativeAdjustment =
    type === MOVEMENT_TYPES.ADJUSTMENT && direction === "DECREASE";

  if (POSITIVE_MOVEMENT_TYPES.has(type) ||
      (type === MOVEMENT_TYPES.ADJUSTMENT && !isNegativeAdjustment)) {
    newOnHand += quantity;
  }

  if (NEGATIVE_MOVEMENT_TYPES.has(type) || isNegativeAdjustment) {
    const available = calculateAvailable(inventory);

    if (quantity > available) {
      throw createError(
        `Insufficient available stock. Available: ${available}, requested: ${quantity}`,
        409
      );
    }

    newOnHand -= quantity;
  }

  /*
   * Reservation does not physically remove stock.
   */
  if (type === MOVEMENT_TYPES.RESERVATION) {
    const available = calculateAvailable(inventory);

    if (quantity > available) {
      throw createError(
        `Insufficient available stock for reservation. Available: ${available}, requested: ${quantity}`,
        409
      );
    }

    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reserved: {
          increment: quantity,
        },
      },
    });
  }

  /*
   * Reservation release returns stock to available
   * by decreasing reserved quantity.
   */
  if (type === MOVEMENT_TYPES.RESERVATION_RELEASE) {
    if (quantity > Number(inventory.reserved)) {
      throw createError(
        "Cannot release more stock than currently reserved",
        409
      );
    }

    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reserved: {
          decrement: quantity,
        },
      },
    });
  }

  /*
   * Update physical stock for normal movements.
   */
  if (
    type !== MOVEMENT_TYPES.RESERVATION &&
    type !== MOVEMENT_TYPES.RESERVATION_RELEASE
  ) {
    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        onHand: newOnHand,
        inTransit: newInTransit,
      },
    });
  }

  /*
   * Create immutable ledger record.
   */
  const movement = await tx.stockMovement.create({
    data: {
      variantId,
      warehouseId: location.warehouseId,
      locationId,
      type,
      quantity,
      referenceType,
      referenceId,
      reason,
      idempotencyKey,
      createdById,
    },
  });

  const updatedInventory = await tx.inventory.findUnique({
    where: {
      id: inventory.id,
    },
  });

  return {
    movement,
    inventory: updatedInventory,
    alreadyProcessed: false,
  };
}

/*
 * Public transaction wrapper.
 *
 * Every caller gets one database transaction.
 */
async function recordMovement(data) {
  return prisma.$transaction(
    async (tx) => {
      return applyStockMovement(tx, data);
    },
    {
      isolationLevel: "Serializable",
    }
  );
}

async function recordMovementInTransaction(tx, data) {
  return applyStockMovement(tx, data);
}

/*
 * Read inventory.
 */
async function getInventory(query) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const where = {
    ...(query.warehouseId && {
      warehouseId: query.warehouseId,
    }),

    ...(query.locationId && {
      locationId: query.locationId,
    }),

    ...(query.variantId && {
      variantId: query.variantId,
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.inventory.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        warehouse: true,
        location: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.inventory.count({
      where,
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      available: calculateAvailable(item),
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/*
 * Get movement ledger.
 */
async function getMovements(query) {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const where = {
    ...(query.warehouseId && {
      warehouseId: query.warehouseId,
    }),

    ...(query.locationId && {
      locationId: query.locationId,
    }),

    ...(query.variantId && {
      variantId: query.variantId,
    }),

    ...(query.type && {
      type: query.type,
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        warehouse: true,
        location: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.stockMovement.count({
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

module.exports = {
  applyStockMovement,
  recordMovement,
  getInventory,
  getMovements,
  calculateAvailable,
  recordMovementInTransaction,
  updateDamagedStock,
};