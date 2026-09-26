const express = require("express");

const controller = require("./location.controller");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(authenticate);

router.get(
  "/warehouse/:warehouseId",
  controller.getLocations
);

router.get(
  "/warehouse/:warehouseId/tree",
  controller.getLocationTree
);

router.get(
  "/:id",
  controller.getLocation
);

router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createLocation
);

router.patch(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updateLocation
);

router.delete(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.deactivateLocation
);

module.exports = router;