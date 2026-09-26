const express = require("express");

const controller = require("./category.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(auth);

router.get("/", controller.getCategories);

router.get("/:id", controller.getCategory);

router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createCategory
);

router.patch(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updateCategory
);

router.delete(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.deactivateCategory
);

module.exports = router;