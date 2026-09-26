const express = require("express");
const authenticate = require("../../middleware/auth.middleware");
const controller = require("./report.controller");

const router = express.Router();
router.use(authenticate);
router.get("/dashboard", controller.getDashboard);
router.get("/forecast", controller.getForecast);
router.get("/anomalies", controller.getAnomalies);
router.get("/dead-stock", controller.getDeadStock);
router.get("/explain", controller.getExplainability);
router.get("/notifications", controller.getNotifications);
router.post("/assistant", controller.assistant);

module.exports = router;
