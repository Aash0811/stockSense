const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const { movementQuerySchema } = require("../inventory/inventory.validation");
const service = require("./audit.service");

const getAuditLog = asyncHandler(async (req, res) => {
	const query = movementQuerySchema.parse(req.query);
	return successResponse(res, await service.getAuditLog(query));
});

module.exports = { getAuditLog };
