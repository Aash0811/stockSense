const { prisma } = require("../../database/prisma");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createWarehouse(data) {
  const existing = await prisma.warehouse.findUnique({
    where: {
      code: data.code,
    },
  });

  if (existing) {
    throw createError("Warehouse code already exists", 409);
  }

  return prisma.warehouse.create({
    data: {
      name: data.name,
      code: data.code,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
    },
  });
}

async function getWarehouses(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const search = query.search?.trim();

  const where = {
    ...(query.active !== undefined && {
      isActive: query.active === "true",
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
        {
          city: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.warehouse.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            locations: true,
          },
        },
      },
    }),

    prisma.warehouse.count({
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

async function getWarehouseById(id) {
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
    },
    include: {
      locations: {
        where: {
          parentId: null,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!warehouse) {
    throw createError("Warehouse not found", 404);
  }

  return warehouse;
}

async function updateWarehouse(id, data) {
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });

  if (!warehouse) {
    throw createError("Warehouse not found", 404);
  }

  if (data.code && data.code !== warehouse.code) {
    const duplicate = await prisma.warehouse.findUnique({
      where: {
        code: data.code,
      },
    });

    if (duplicate) {
      throw createError("Warehouse code already exists", 409);
    }
  }

  return prisma.warehouse.update({
    where: {
      id,
    },
    data,
  });
}

async function deactivateWarehouse(id) {
  const warehouse = await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });

  if (!warehouse) {
    throw createError("Warehouse not found", 404);
  }

  return prisma.warehouse.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deactivateWarehouse,
};