const prisma = require("../../database/prisma");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureWarehouseExists(warehouseId) {
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id: warehouseId,
    },
  });

  if (!warehouse) {
    throw createError("Warehouse not found", 404);
  }

  if (!warehouse.isActive) {
    throw createError("Warehouse is inactive", 400);
  }

  return warehouse;
}

async function ensureParentLocationValid(
  warehouseId,
  parentId
) {
  if (!parentId) {
    return null;
  }

  const parent = await prisma.location.findUnique({
    where: {
      id: parentId,
    },
  });

  if (!parent) {
    throw createError("Parent location not found", 404);
  }

  if (parent.warehouseId !== warehouseId) {
    throw createError(
      "Parent location belongs to a different warehouse",
      400
    );
  }

  if (!parent.isActive) {
    throw createError(
      "Parent location is inactive",
      400
    );
  }

  return parent;
}

async function ensureLocationCodeAvailable({
  warehouseId,
  code,
  excludeId,
}) {
  const existing = await prisma.location.findFirst({
    where: {
      warehouseId,
      code,
      ...(excludeId && {
        NOT: {
          id: excludeId,
        },
      }),
    },
  });

  if (existing) {
    throw createError(
      "Location code already exists in this warehouse",
      409
    );
  }
}

async function createLocation(data) {
  await ensureWarehouseExists(data.warehouseId);

  await ensureParentLocationValid(
    data.warehouseId,
    data.parentId
  );

  await ensureLocationCodeAvailable({
    warehouseId: data.warehouseId,
    code: data.code,
  });

  return prisma.location.create({
    data: {
      warehouseId: data.warehouseId,
      parentId: data.parentId || null,
      name: data.name,
      code: data.code,
      type: data.type,
      isActive: data.isActive ?? true,
    },
  });
}

async function getLocations(warehouseId, query) {
  await ensureWarehouseExists(warehouseId);

  const search = query.search?.trim();

  return prisma.location.findMany({
    where: {
      warehouseId,

      ...(query.type && {
        type: query.type,
      }),

      ...(query.active !== undefined && {
        isActive: query.active === "true",
      }),

      ...(query.parentId !== undefined && {
        parentId:
          query.parentId === "null"
            ? null
            : query.parentId,
      }),

      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }),
    },

    orderBy: {
      name: "asc",
    },
  });
}

async function getLocationTree(warehouseId) {
  await ensureWarehouseExists(warehouseId);

  const locations = await prisma.location.findMany({
    where: {
      warehouseId,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const map = new Map();

  locations.forEach((location) => {
    map.set(location.id, {
      ...location,
      children: [],
    });
  });

  const roots = [];

  locations.forEach((location) => {
    const node = map.get(location.id);

    if (!location.parentId) {
      roots.push(node);
      return;
    }

    const parent = map.get(location.parentId);

    if (parent) {
      parent.children.push(node);
    }
  });

  return roots;
}

async function getLocationById(id) {
  const location = await prisma.location.findUnique({
    where: {
      id,
    },
    include: {
      warehouse: true,
      parent: true,
      children: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!location) {
    throw createError("Location not found", 404);
  }

  return location;
}

async function updateLocation(id, data) {
  const location = await prisma.location.findUnique({
    where: {
      id,
    },
  });

  if (!location) {
    throw createError("Location not found", 404);
  }

  if (data.code && data.code !== location.code) {
    await ensureLocationCodeAvailable({
      warehouseId: location.warehouseId,
      code: data.code,
      excludeId: id,
    });
  }

  return prisma.location.update({
    where: {
      id,
    },
    data,
  });
}

async function deactivateLocation(id) {
  const location = await prisma.location.findUnique({
    where: {
      id,
    },
    include: {
      children: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!location) {
    throw createError("Location not found", 404);
  }

  if (location.children.length > 0) {
    throw createError(
      "Cannot deactivate a location that has active child locations",
      400
    );
  }

  return prisma.location.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  createLocation,
  getLocations,
  getLocationTree,
  getLocationById,
  updateLocation,
  deactivateLocation,
};