const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./location.service");

const {
  locationIdSchema,
  warehouseIdSchema,
  createLocationSchema,
  updateLocationSchema,
} = require("./location.validation");

const createLocation = asyncHandler(async (req, res) => {
  const data = createLocationSchema.parse(req.body);

  const location = await service.createLocation(data);

  return successResponse(
    res,
    location,
    "Location created successfully",
    201
  );
});

const getLocations = asyncHandler(async (req, res) => {
  const { warehouseId } =
    warehouseIdSchema.parse(req.params);

  const locations = await service.getLocations(
    warehouseId,
    req.query
  );

  return successResponse(res, locations);
});

const getLocationTree = asyncHandler(async (req, res) => {
  const { warehouseId } =
    warehouseIdSchema.parse(req.params);

  const tree = await service.getLocationTree(
    warehouseId
  );

  return successResponse(res, tree);
});

const getLocation = asyncHandler(async (req, res) => {
  const { id } = locationIdSchema.parse(req.params);

  const location = await service.getLocationById(id);

  return successResponse(res, location);
});

const updateLocation = asyncHandler(async (req, res) => {
  const { id } = locationIdSchema.parse(req.params);

  const data = updateLocationSchema.parse(req.body);

  const location = await service.updateLocation(
    id,
    data
  );

  return successResponse(
    res,
    location,
    "Location updated successfully"
  );
});

const deactivateLocation = asyncHandler(async (req, res) => {
  const { id } = locationIdSchema.parse(req.params);

  const location = await service.deactivateLocation(id);

  return successResponse(
    res,
    location,
    "Location deactivated successfully"
  );
});

module.exports = {
  createLocation,
  getLocations,
  getLocationTree,
  getLocation,
  updateLocation,
  deactivateLocation,
};