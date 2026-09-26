const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./report.service");

const getDashboard = asyncHandler(async (req, res) => {
	return successResponse(res, await service.getDashboard());
});

module.exports = { getDashboard };
