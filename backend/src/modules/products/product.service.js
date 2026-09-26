const { prisma } = require("../../database/prisma");

function conflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function ensureCategoryExists(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw notFound("Category not found");
  }

  if (!category.active) {
    throw conflict("Cannot use an inactive category");
  }
}

async function ensureProductIdentifiersAvailable({
  sku,
  barcode,
  excludeId,
}) {
  if (sku) {
    const existingSku = await prisma.product.findFirst({
      where: {
        sku,
        ...(excludeId && {
          NOT: { id: excludeId },
        }),
      },
    });

    if (existingSku) {
      throw conflict("Product SKU already exists");
    }
  }

  if (barcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: {
        barcode,
        ...(excludeId && {
          NOT: { id: excludeId },
        }),
      },
    });

    if (existingBarcode) {
      throw conflict("Product barcode already exists");
    }

    const variantBarcode = await prisma.productVariant.findFirst({
      where: {
        barcode,
      },
    });

    if (variantBarcode) {
      throw conflict("Barcode is already assigned to a variant");
    }
  }
}

async function ensureVariantIdentifiersAvailable({
  sku,
  barcode,
  excludeId,
}) {
  const productSku = await prisma.product.findUnique({
    where: { sku },
  });

  if (productSku) {
    throw conflict("Variant SKU conflicts with an existing product SKU");
  }

  const existingSku = await prisma.productVariant.findFirst({
    where: {
      sku,
      ...(excludeId && {
        NOT: { id: excludeId },
      }),
    },
  });

  if (existingSku) {
    throw conflict("Variant SKU already exists");
  }

  if (barcode) {
    const productBarcode = await prisma.product.findUnique({
      where: { barcode },
    });

    if (productBarcode) {
      throw conflict("Variant barcode conflicts with an existing product barcode");
    }

    const existingBarcode = await prisma.productVariant.findFirst({
      where: {
        barcode,
        ...(excludeId && {
          NOT: { id: excludeId },
        }),
      },
    });

    if (existingBarcode) {
      throw conflict("Variant barcode already exists");
    }
  }
}

async function createProduct(data) {
  await ensureCategoryExists(data.categoryId);

  await ensureProductIdentifiersAvailable({
    sku: data.sku,
    barcode: data.barcode,
  });

  if (data.variants?.length) {
    const variantSkus = new Set();
    const variantBarcodes = new Set();

    for (const variant of data.variants) {
      if (variantSkus.has(variant.sku)) {
        throw conflict(
          `Duplicate variant SKU in request: ${variant.sku}`
        );
      }

      variantSkus.add(variant.sku);

      if (variant.barcode) {
        if (variantBarcodes.has(variant.barcode)) {
          throw conflict(
            `Duplicate variant barcode in request: ${variant.barcode}`
          );
        }

        variantBarcodes.add(variant.barcode);
      }

      await ensureVariantIdentifiersAvailable({
        sku: variant.sku,
        barcode: variant.barcode,
      });
    }
  }

  return prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description || null,
      brand: data.brand || null,
      barcode: data.barcode || null,
      categoryId: data.categoryId,
      trackingType: data.trackingType,
      unitName: data.unitName,
      minimumStock: data.minimumStock,
      safetyStock: data.safetyStock,
      leadTimeDays: data.leadTimeDays,
      reorderPoint: data.reorderPoint,
      status: data.status,

      variants: data.variants?.length
        ? {
            create: data.variants.map((variant) => ({
              name: variant.name,
              sku: variant.sku,
              barcode: variant.barcode || null,
              price: variant.price ?? 0,
              cost: variant.cost ?? 0,
              isActive: variant.isActive ?? true,
            })),
          }
        : undefined,
    },

    include: {
      category: true,
      variants: true,
    },
  });
}

async function getProducts(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || 20, 1),
    100
  );

  const search = query.search?.trim();

  const where = {
    ...(query.status && {
      status: query.status,
    }),

    ...(query.categoryId && {
      categoryId: query.categoryId,
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
          sku: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          barcode: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          variants: {
            some: {
              OR: [
                {
                  sku: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  barcode: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.product.count({
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

async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },

    include: {
      category: true,

      variants: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!product) {
    throw notFound("Product not found");
  }

  return product;
}

async function updateProduct(id, data) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw notFound("Product not found");
  }

  if (data.categoryId) {
    await ensureCategoryExists(data.categoryId);
  }

  await ensureProductIdentifiersAvailable({
    sku: data.sku,
    barcode: data.barcode,
    excludeId: id,
  });

  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      variants: true,
    },
  });
}

async function deactivateProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw notFound("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: {
      status: "INACTIVE",
    },
    include: {
      category: true,
      variants: true,
    },
  });
}

async function createVariant(productId, data) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw notFound("Product not found");
  }

  await ensureVariantIdentifiersAvailable({
    sku: data.sku,
    barcode: data.barcode,
  });

  return prisma.productVariant.create({
    data: {
      productId,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode || null,
      price: data.price ?? 0,
      cost: data.cost ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

async function updateVariant(productId, variantId, data) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
    },
  });

  if (!variant) {
    throw notFound("Variant not found");
  }

  if (data.sku || data.barcode) {
    await ensureVariantIdentifiersAvailable({
      sku: data.sku || variant.sku,
      barcode: data.barcode || variant.barcode,
      excludeId: variantId,
    });
  }

  return prisma.productVariant.update({
    where: {
      id: variantId,
    },
    data,
  });
}

async function deactivateVariant(productId, variantId) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
    },
  });

  if (!variant) {
    throw notFound("Variant not found");
  }

  return prisma.productVariant.update({
    where: {
      id: variantId,
    },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deactivateProduct,
  createVariant,
  updateVariant,
  deactivateVariant,
};