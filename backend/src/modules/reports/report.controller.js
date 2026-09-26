const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./report.service");
const { z } = require("zod");

const getDashboard = asyncHandler(async (req, res) => {
	return successResponse(res, await service.getDashboard(req.query));
});

const getForecast = asyncHandler(async (req, res) => successResponse(res, await service.getForecast()));
const getAnomalies = asyncHandler(async (req, res) => successResponse(res, await service.getAnomalies()));
const getDeadStock = asyncHandler(async (req, res) => successResponse(res, await service.getDeadStock()));
const getExplainability = asyncHandler(async (req, res) => successResponse(res, await service.getExplainability(req.query)));
const getNotifications = asyncHandler(async (req, res) => successResponse(res, await service.getNotifications()));

const assistant = asyncHandler(async (req, res) => {
	const { question } = z.object({ question: z.string().trim().min(2).max(500) }).parse(req.body);
	return successResponse(res, await service.answerAssistant(question));
});

module.exports = {
	getDashboard,
	getForecast,
	getAnomalies,
	getDeadStock,
	getExplainability,
	getNotifications,
	assistant,
};
