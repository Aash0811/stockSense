const asyncHandler = require("../../utils/asyncHandler");
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} = require("./category.validation");

const service = require("./category.service");
const { successResponse } = require("../../utils/apiResponse");

const createCategory = asyncHandler(async (req, res) => {
  const data = createCategorySchema.parse(req.body);

  const category = await service.createCategory(data);

  return successResponse(res, category, "Category created", 201);
});

const getCategories = asyncHandler(async (req, res) => {
  const result = await service.getCategories(req.query);

  return successResponse(res, result);
});

const getCategory = asyncHandler(async (req, res) => {
  const { id } = categoryIdSchema.parse(req.params);

  const category = await service.getCategoryById(id);

  return successResponse(res, category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = categoryIdSchema.parse(req.params);
  const data = updateCategorySchema.parse(req.body);

  const category = await service.updateCategory(id, data);

  return successResponse(res, category, "Category updated");
});

const deactivateCategory = asyncHandler(async (req, res) => {
  const { id } = categoryIdSchema.parse(req.params);

  const category = await service.deactivateCategory(id);

  return successResponse(res, category, "Category deactivated");
});

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deactivateCategory,
};