const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./product.service");

const {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  idSchema,
  variantIdSchema,
} = require("./product.validation");

const createProduct = asyncHandler(async (req, res) => {
  const data = createProductSchema.parse(req.body);

  const product = await service.createProduct(data);

  return successResponse(
    res,
    product,
    "Product created successfully",
    201
  );
});

const getProducts = asyncHandler(async (req, res) => {
  const result = await service.getProducts(req.query);

  return successResponse(res, result);
});

const getProduct = asyncHandler(async (req, res) => {
  const { id } = idSchema.parse(req.params);

  const product = await service.getProductById(id);

  return successResponse(res, product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = idSchema.parse(req.params);

  const data = updateProductSchema.parse(req.body);

  const product = await service.updateProduct(id, data);

  return successResponse(
    res,
    product,
    "Product updated successfully"
  );
});

const deactivateProduct = asyncHandler(async (req, res) => {
  const { id } = idSchema.parse(req.params);

  const product = await service.deactivateProduct(id);

  return successResponse(
    res,
    product,
    "Product deactivated successfully"
  );
});

const createVariant = asyncHandler(async (req, res) => {
  const { id } = idSchema.parse(req.params);

  const data = createVariantSchema.parse(req.body);

  const variant = await service.createVariant(id, data);

  return successResponse(
    res,
    variant,
    "Variant created successfully",
    201
  );
});

const updateVariant = asyncHandler(async (req, res) => {
  const { id, variantId } = variantIdSchema.parse(req.params);

  const data = updateVariantSchema.parse(req.body);

  const variant = await service.updateVariant(
    id,
    variantId,
    data
  );

  return successResponse(
    res,
    variant,
    "Variant updated successfully"
  );
});

const deactivateVariant = asyncHandler(async (req, res) => {
  const { id, variantId } = variantIdSchema.parse(req.params);

  const variant = await service.deactivateVariant(
    id,
    variantId
  );

  return successResponse(
    res,
    variant,
    "Variant deactivated successfully"
  );
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deactivateProduct,
  createVariant,
  updateVariant,
  deactivateVariant,
};