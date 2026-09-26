const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./purchaseOrder.service");

const {
  createPurchaseOrderSchema,
  purchaseOrderIdSchema,
  updatePurchaseOrderStatusSchema,
} = require("./purchasing.validation");

const createPurchaseOrder = asyncHandler(
  async (req, res) => {
    const data = createPurchaseOrderSchema.parse(
      req.body
    );

    const purchaseOrder =
      await service.createPurchaseOrder(
        data,
        req.user.userId
      );

    return successResponse(
      res,
      purchaseOrder,
      "Purchase order created successfully",
      201
    );
  }
);

const getPurchaseOrders = asyncHandler(
  async (req, res) => {
    const result =
      await service.getPurchaseOrders(req.query);

    return successResponse(res, result);
  }
);

const getPurchaseOrder = asyncHandler(
  async (req, res) => {
    const { id } =
      purchaseOrderIdSchema.parse(req.params);

    const purchaseOrder =
      await service.getPurchaseOrderById(id);

    return successResponse(
      res,
      purchaseOrder
    );
  }
);

const updatePurchaseOrderStatus =
  asyncHandler(async (req, res) => {
    const { id } =
      purchaseOrderIdSchema.parse(req.params);

    const { status } =
      updatePurchaseOrderStatusSchema.parse(
        req.body
      );

    const purchaseOrder =
      await service.updatePurchaseOrderStatus(
        id,
        status
      );

    return successResponse(
      res,
      purchaseOrder,
      "Purchase order status updated"
    );
  });

module.exports = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrderStatus,
};