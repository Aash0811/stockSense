const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./inventory.service");

const {
  inventoryQuerySchema,
  movementQuerySchema,
} = require("./inventory.validation");

const getInventory = asyncHandler(async (req, res) => {
  const query = inventoryQuerySchema.parse(req.query);

  const result = await service.getInventory(query);

  return successResponse(res, result);
});

const getMovements = asyncHandler(async (req, res) => {
  const query = movementQuerySchema.parse(req.query);

  const result = await service.getMovements(query);

  return successResponse(res, result);
});

module.exports = {
  getInventory,
  getMovements,
};