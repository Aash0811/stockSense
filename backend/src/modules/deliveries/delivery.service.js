const prisma = require("../../database/prisma");
const {
  MOVEMENT_TYPES,
} = require("../inventory/inventory.constants");
const inventoryService = require("../inventory/inventory.service");

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
    throw createDeliveryError(`Location ${locationId} not found`, 404, "LOCATION_NOT_FOUND");
  }

  if (location.warehouseId !== warehouseId) {
    throw createDeliveryError(
      "Location does not belong to the selected warehouse",
      400,
      "LOCATION_WAREHOUSE_MISMATCH"
    );
  }

  if (!location.isActive) {
    throw createDeliveryError("Location is inactive", 400, "LOCATION_INACTIVE");
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

function createDeliveryError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
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

async function fulfillDelivery(
  id,
  requestedItems,
  userId,
  idempotencyKey
) {
  return prisma.$transaction(
    async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!delivery) {
        const error = new Error("Delivery not found");
        error.statusCode = 404;
        error.code = "DELIVERY_NOT_FOUND";
        throw error;
      }

      if (!["READY", "PICKING", "PACKED", "SHIPPED"].includes(delivery.status)) {
        const error = new Error(
          `Delivery cannot be fulfilled while ${delivery.status}`
        );
        error.statusCode = 400;
        error.code = "DELIVERY_NOT_FULFILLABLE";
        throw error;
      }

      const deliveryItems = new Map(
        delivery.items.map((item) => [item.id, item])
      );
      const seenItemIds = new Set();

      for (const requestedItem of requestedItems) {
        if (seenItemIds.has(requestedItem.deliveryItemId)) {
          const error = new Error("Duplicate delivery item in fulfillment request");
          error.statusCode = 400;
          error.code = "DUPLICATE_DELIVERY_ITEM";
          throw error;
        }

        seenItemIds.add(requestedItem.deliveryItemId);
        const deliveryItem = deliveryItems.get(requestedItem.deliveryItemId);

        if (!deliveryItem) {
          const error = new Error("Delivery item does not belong to this delivery");
          error.statusCode = 400;
          error.code = "DELIVERY_ITEM_MISMATCH";
          throw error;
        }

        const remaining =
          deliveryItem.orderedQuantity - deliveryItem.deliveredQuantity;

        if (requestedItem.quantity > remaining) {
          const error = new Error(
            `Fulfillment exceeds remaining quantity for delivery item ${deliveryItem.id}`
          );
          error.statusCode = 409;
          error.code = "DELIVERY_OVER_FULFILLMENT";
          throw error;
        }

        const itemKey = idempotencyKey
          ? `delivery:${id}:request:${idempotencyKey}:item:${deliveryItem.id}`
          : `delivery:${id}:item:${deliveryItem.id}:from:${deliveryItem.deliveredQuantity}:quantity:${requestedItem.quantity}`;

        const movementResult = await inventoryService.recordMovementInTransaction(tx, {
          variantId: deliveryItem.variantId,
          locationId: deliveryItem.locationId,
          type: MOVEMENT_TYPES.DELIVERY,
          quantity: requestedItem.quantity,
          referenceType: "DELIVERY",
          referenceId: id,
          idempotencyKey: itemKey,
          createdById: userId,
        });

        if (!movementResult.alreadyProcessed) {
          await tx.deliveryItem.update({
            where: { id: deliveryItem.id },
            data: {
              deliveredQuantity: {
                increment: requestedItem.quantity,
              },
            },
          });
        }
      }

      const updatedItems = await tx.deliveryItem.findMany({
        where: { deliveryId: id },
      });
      const fullyDelivered = updatedItems.every(
        (item) => item.deliveredQuantity >= item.orderedQuantity
      );

      return tx.delivery.update({
        where: { id },
        data: {
          status: fullyDelivered ? "DELIVERED" : delivery.status,
        },
        include: {
          warehouse: true,
          items: {
            include: {
              variant: { include: { product: true } },
              location: true,
            },
          },
        },
      });
    },
    { isolationLevel: "Serializable" }
  );
}

module.exports = {
  createDelivery,
  getDeliveryById,
  getDeliveries,
  updateDeliveryStatus,
  fulfillDelivery,
};