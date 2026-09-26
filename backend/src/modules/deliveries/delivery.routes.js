const express = require("express");

const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

const controller = require("./delivery.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getDeliveries);

router.get("/recommend-warehouse", controller.recommendWarehouse);

router.get("/:id", controller.getDeliveryById);

router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  controller.createDelivery
);

router.patch(
  "/:id/status",
  authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  controller.updateDeliveryStatus
);

router.post(
  "/:id/fulfill",
  authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"),
  controller.fulfillDelivery
);

module.exports = router;