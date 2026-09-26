const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");
const controller = require("./audit.controller");

const router = express.Router();
router.use(authenticate);
router.get("/", authorize("ADMIN", "INVENTORY_MANAGER", "AUDITOR"), controller.getAuditLog);

module.exports = router;
