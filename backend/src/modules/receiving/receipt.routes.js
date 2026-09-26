const express = require("express");

const controller = require("./receipt.controller");

const authenticate = require("../../middleware/auth.middleware");

const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getReceipts);

router.get("/:id", controller.getReceipt);

router.post(
  "/",
  authorize(
    "ADMIN",
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  controller.createReceipt
);

router.post(
  "/:id/validate",
  authorize(
    "ADMIN",
    "INVENTORY_MANAGER",
    "WAREHOUSE_STAFF"
  ),
  controller.validateReceipt
);

module.exports = router;