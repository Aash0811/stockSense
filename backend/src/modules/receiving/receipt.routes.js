const express = require("express");

const controller = require("./receiving.controller");

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

module.exports = router;