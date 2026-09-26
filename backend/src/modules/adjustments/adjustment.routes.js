const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");
const controller = require("./adjustment.controller");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.getAdjustments);
router.get("/:id", controller.getAdjustment);
router.post("/", authorize("ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"), controller.createAdjustment);

module.exports = router;
