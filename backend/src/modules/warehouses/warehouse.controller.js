const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./warehouse.service");
const {
	warehouseIdSchema,
	createWarehouseSchema,
	updateWarehouseSchema,
} = require("./warehouse.validation");

const createWarehouse = asyncHandler(async (req, res) => {
	const data = createWarehouseSchema.parse(req.body);
	const warehouse = await service.createWarehouse(data);

	return successResponse(
		res,
		warehouse,
		"Warehouse created successfully",
		201
	);
});

const getWarehouses = asyncHandler(async (req, res) => {
	const warehouses = await service.getWarehouses(req.query);
	return successResponse(res, warehouses);
});

const getWarehouse = asyncHandler(async (req, res) => {
	const { id } = warehouseIdSchema.parse(req.params);
	const warehouse = await service.getWarehouseById(id);

	return successResponse(res, warehouse);
});

const updateWarehouse = asyncHandler(async (req, res) => {
	const { id } = warehouseIdSchema.parse(req.params);
	const data = updateWarehouseSchema.parse(req.body);
	const warehouse = await service.updateWarehouse(id, data);

	return successResponse(res, warehouse, "Warehouse updated successfully");
});

const deactivateWarehouse = asyncHandler(async (req, res) => {
	const { id } = warehouseIdSchema.parse(req.params);
	const warehouse = await service.deactivateWarehouse(id);

	return successResponse(
		res,
		warehouse,
		"Warehouse deactivated successfully"
	);
});

module.exports = {
	createWarehouse,
	getWarehouses,
	getWarehouse,
	updateWarehouse,
	deactivateWarehouse,
};
