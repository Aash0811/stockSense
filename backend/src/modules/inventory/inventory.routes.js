const express = require("express");

const controller = require("./inventory.controller");
const authenticate = require("../../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getInventory);

router.get("/movements", controller.getMovements);

module.exports = router;