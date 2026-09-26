const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./transfer.service");
const { transferIdSchema, createTransferSchema, receiveTransferSchema } = require("./transfer.validation");

const createTransfer = asyncHandler(async (req, res) => {
	const transfer = await service.createTransfer(createTransferSchema.parse(req.body));
	return successResponse(res, transfer, "Transfer created successfully", 201);
});

const getTransfer = asyncHandler(async (req, res) => {
	const { id } = transferIdSchema.parse(req.params);
	return successResponse(res, await service.getTransfer(id));
});

const dispatchTransfer = asyncHandler(async (req, res) => {
	const { id } = transferIdSchema.parse(req.params);
	return successResponse(res, await service.dispatchTransfer(id, req.user.userId));
});

const receiveTransfer = asyncHandler(async (req, res) => {
	const { id } = transferIdSchema.parse(req.params);
	const data = receiveTransferSchema.parse(req.body);
	return successResponse(res, await service.receiveTransfer(id, data.items, req.user.userId));
});

const getTransfers = asyncHandler(async (req, res) => successResponse(res, await service.getTransfers(req.query)));

module.exports = { createTransfer, getTransfer, getTransfers, dispatchTransfer, receiveTransfer };
