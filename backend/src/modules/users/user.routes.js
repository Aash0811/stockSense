const express = require("express");
const userController = require("./user.controller");
const authenticate = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

// All user management routes require ADMIN role
router.use(authenticate, authorize("ADMIN"));

router.get("/", asyncHandler(userController.listUsers));
router.post("/", asyncHandler(userController.createUser));
router.patch("/:id", asyncHandler(userController.updateUser));
router.delete("/:id", asyncHandler(userController.deleteUser));

module.exports = router;
