const prisma = require("../../database/prisma");

async function createCategory(data) {
  const existing = await prisma.category.findUnique({
    where: {
      name: data.name,
    },
  });

  if (existing) {
    const error = new Error("Category already exists");
    error.statusCode = 409;
    throw error;
  }

  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description || null,
    },
  });
}

async function getCategories(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const search = query.search?.trim();

  const where = {
    ...(query.active !== undefined && {
      isActive: query.active === "true",
    }),

    ...(search && {
      name: {
        contains: search,
        mode: "insensitive",
      },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.category.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),

    prisma.category.count({
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

async function getCategoryById(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  return category;
}

async function updateCategory(id, data) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.name && data.name !== category.name) {
    const duplicate = await prisma.category.findUnique({
      where: {
        name: data.name,
      },
    });

    if (duplicate) {
      const error = new Error("Category name already exists");
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

async function deactivateCategory(id) {
  return updateCategory(id, {
    isActive: false,
  });
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deactivateCategory,
};