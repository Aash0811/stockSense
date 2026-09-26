const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./adjustment.service");
const { adjustmentIdSchema, createAdjustmentSchema } = require("./adjustment.validation");

const createAdjustment = asyncHandler(async (req, res) => {
	const data = createAdjustmentSchema.parse(req.body);
	return successResponse(res, await service.createAdjustment(data, req.user.userId), "Adjustment created successfully", 201);
});

const getAdjustment = asyncHandler(async (req, res) => {
	const { id } = adjustmentIdSchema.parse(req.params);
	return successResponse(res, await service.getAdjustment(id));
});

const getAdjustments = asyncHandler(async (req, res) => successResponse(res, await service.getAdjustments(req.query)));

module.exports = { createAdjustment, getAdjustment, getAdjustments };
