const express = require("express");

const controller = require("./warehouse.controller");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getWarehouses);

router.get("/:id", controller.getWarehouse);

router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createWarehouse
);

router.patch(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updateWarehouse
);

router.delete(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.deactivateWarehouse
);

module.exports = router;