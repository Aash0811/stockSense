const asyncHandler = require("../../utils/asyncHandler");
const {
  createDeliverySchema,
  updateDeliveryStatusSchema,
  fulfillDeliverySchema,
  deliveryListQuerySchema,
} = require("./delivery.validation");

const deliveryService = require("./delivery.service");

const createDelivery = asyncHandler(async (req, res) => {
  const data = createDeliverySchema.parse(req.body);

  const delivery = await deliveryService.createDelivery(
    data,
    req.user.userId
  );

  res.status(201).json({
    success: true,
    data: delivery,
  });
});

const getDeliveries = asyncHandler(async (req, res) => {
  const query = deliveryListQuerySchema.parse(req.query);

  const result = await deliveryService.getDeliveries(query);

  res.json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
});

const getDeliveryById = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.getDeliveryById(req.params.id);

  res.json({
    success: true,
    data: delivery,
  });
});

const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const data = updateDeliveryStatusSchema.parse(req.body);

  const delivery = await deliveryService.updateDeliveryStatus(
    req.params.id,
    data.status
  );

  res.json({
    success: true,
    data: delivery,
  });
});

const fulfillDelivery = asyncHandler(async (req, res) => {
  const data = fulfillDeliverySchema.parse(req.body);

  const delivery = await deliveryService.fulfillDelivery(
    req.params.id,
    data.items,
    req.user.userId,
    req.get("Idempotency-Key")
  );

  res.json({
    success: true,
    data: delivery,
  });
});

const recommendWarehouse = asyncHandler(async (req, res) => {
  const { variantId, quantity } = req.query;
  if (!variantId) {
    return res.status(400).json({ success: false, error: { message: "variantId is required" } });
  }
  const result = await deliveryService.recommendWarehouse(variantId, quantity);
  res.json({
    success: true,
    data: result,
  });
});

module.exports = {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  fulfillDelivery,
  recommendWarehouse,
};