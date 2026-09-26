const asyncHandler = require("../../utils/asyncHandler");
const { successResponse } = require("../../utils/apiResponse");

const service = require("./receipt.service");

const {
  createReceiptSchema,
  receiptIdSchema,
} = require("./receipt.validation");

const createReceipt = asyncHandler(
  async (req, res) => {
    const data = createReceiptSchema.parse(
      req.body
    );

    const receipt =
      await service.createReceipt(
        data,
        req.user.userId
      );

    return successResponse(
      res,
      receipt,
      "Receipt created successfully",
      201
    );
  }
);

const getReceipts = asyncHandler(
  async (req, res) => {
    const result =
      await service.getReceipts(req.query);

    return successResponse(res, result);
  }
);

const getReceipt = asyncHandler(
  async (req, res) => {
    const { id } =
      receiptIdSchema.parse(req.params);

    const receipt =
      await service.getReceiptById(id);

    return successResponse(
      res,
      receipt
    );
  }
);

module.exports = {
  createReceipt,
  getReceipts,
  getReceipt,
};