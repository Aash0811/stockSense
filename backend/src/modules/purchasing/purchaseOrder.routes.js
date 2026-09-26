const express = require("express");

const controller = require("./purchaseOrder.controller");

const authenticate = require("../../middleware/auth.middleware");

const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getPurchaseOrders);

router.get("/:id", controller.getPurchaseOrder);

router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createPurchaseOrder
);

router.patch(
  "/:id/status",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updatePurchaseOrderStatus
);

module.exports = router;