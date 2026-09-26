const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");
const controller = require("./transfer.controller");

const router = express.Router();
router.use(authenticate);
router.get("/:id", controller.getTransfer);
router.post("/", authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"), controller.createTransfer);
router.post("/:id/dispatch", authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"), controller.dispatchTransfer);
router.post("/:id/receive", authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"), controller.receiveTransfer);

module.exports = router;
