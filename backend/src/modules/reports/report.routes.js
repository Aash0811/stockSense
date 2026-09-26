const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const controller = require("./report.controller");

const router = express.Router();
router.use(authenticate);
router.get("/dashboard", controller.getDashboard);

module.exports = router;
