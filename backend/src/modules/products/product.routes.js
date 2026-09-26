const express = require("express");

const controller = require("./product.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

const router = express.Router();

router.use(auth);

/*
 * Product read access
 */
router.get("/", controller.getProducts);

router.get("/lookup/barcode/:barcode", controller.lookupBarcode);

router.get("/:id", controller.getProduct);

/*
 * Product management
 */
router.post(
  "/",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createProduct
);

router.patch(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updateProduct
);

router.delete(
  "/:id",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.deactivateProduct
);

/*
 * Variant management
 */
router.post(
  "/:id/variants",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.createVariant
);

router.patch(
  "/:id/variants/:variantId",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.updateVariant
);

router.delete(
  "/:id/variants/:variantId",
  authorize("ADMIN", "INVENTORY_MANAGER"),
  controller.deactivateVariant
);

module.exports = router;