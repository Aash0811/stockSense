const prisma = require("../../database/prisma");

const STATUS_TRANSITIONS = {
  DRAFT: ["READY", "CANCELED"],
  READY: ["PICKING", "CANCELED"],
  PICKING: ["PACKED", "CANCELED"],
  PACKED: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
};

async function ensureWarehouse(tx, warehouseId) {
  const warehouse = await tx.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    const error = new Error("Warehouse not found");
    error.statusCode = 404;
    error.code = "WAREHOUSE_NOT_FOUND";
    throw error;
  }

  if (!warehouse.isActive) {
    const error = new Error("Warehouse is inactive");
    error.statusCode = 400;
    error.code = "WAREHOUSE_INACTIVE";
    throw error;
  }

  return warehouse;
}

async function ensureVariant(tx, variantId) {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
    },
  });

  if (!variant) {
    const error = new Error(`Variant ${variantId} not found`);
    error.statusCode = 404;
    error.code = "VARIANT_NOT_FOUND";
    throw error;
  }

  if (!variant.isActive || variant.product.status !== "ACTIVE") {
    const error = new Error(
      `Variant ${variantId} belongs to an inactive product or variant`
    );

    error.statusCode = 400;
    error.code = "VARIANT_INACTIVE";

    throw error;
  }

  return variant;
}

async function ensureLocation(tx, locationId, warehouseId) {
  const location = await tx.location.findUnique({
    where: { id: locationId },
  });

  if (!location) {
    const error = new Error(`Location ${locationId} not found`);
    error.statusCode = 404;
    error.code = "LOCATION_NOT_FOUND";
    throw error;
  }

  if (location.warehouseId !== warehouseId) {
    const error = new Error(
      "Location does not belong to the selected warehouse"
    );

    error.statusCode = 400;
    error.code = "LOCATION_WAREHOUSE_MISMATCH";

    throw error;
  }

  if (!location.isActive) {
    const error = new Error("Location is inactive");
    error.statusCode = 400;
    error.code = "LOCATION_INACTIVE";
    throw error;
  }

  return location;
}

async function createDelivery(data, userId) {
  const { deliveryNumber, warehouseId, items } = data;

  return prisma.$transaction(
    async (tx) => {
      await ensureWarehouse(tx, warehouseId);

      const existingDelivery = await tx.delivery.findUnique({
        where: { deliveryNumber },
      });

      if (existingDelivery) {
        const error = new Error(
          `Delivery ${deliveryNumber} already exists`
        );

        error.statusCode = 409;
        error.code = "DELIVERY_NUMBER_EXISTS";

        throw error;
      }

      for (const item of items) {
        await ensureVariant(tx, item.variantId);
        await ensureLocation(tx, item.locationId, warehouseId);
      }

      const delivery = await tx.delivery.create({
        data: {
          deliveryNumber,
          warehouseId,
          status: "DRAFT",
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              locationId: item.locationId,
              orderedQuantity: item.orderedQuantity,
            })),
          },
        },
        include: {
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

      return delivery;
    },
    {
      isolationLevel: "Serializable",
    }
  );
}

async function getDeliveryById(id) {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
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

  if (!delivery) {
    const error = new Error("Delivery not found");
    error.statusCode = 404;
    error.code = "DELIVERY_NOT_FOUND";
    throw error;
  }

  return delivery;
}

async function getDeliveries(query) {
  const {
    page = 1,
    limit = 20,
    status,
    warehouseId,
    search,
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
    ...(search && {
      deliveryNumber: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
    }),

    prisma.delivery.count({
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

async function updateDeliveryStatus(id, newStatus) {
  return prisma.$transaction(
    async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id },
      });

      if (!delivery) {
        const error = new Error("Delivery not found");
        error.statusCode = 404;
        error.code = "DELIVERY_NOT_FOUND";
        throw error;
      }

      const allowedTransitions = STATUS_TRANSITIONS[delivery.status] || [];

      if (!allowedTransitions.includes(newStatus)) {
        const error = new Error(
          `Invalid delivery status transition: ${delivery.status} → ${newStatus}`
        );

        error.statusCode = 400;
        error.code = "INVALID_DELIVERY_STATUS_TRANSITION";

        throw error;
      }

      return tx.delivery.update({
        where: { id },
        data: {
          status: newStatus,
        },
        include: {
          warehouse: true,
          items: true,
        },
      });
    },
    {
      isolationLevel: "Serializable",
    }
  );
}

module.exports = {
  createDelivery,
  getDeliveryById,
  getDeliveries,
  updateDeliveryStatus,
};