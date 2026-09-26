const express = require("express");

const authController = require("./auth.controller");
const validate = require("../../middleware/validate.middleware");
const authenticate = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const { loginSchema } = require("./auth.validation");

const router = express.Router();

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.get(
  "/me",
  authenticate,
  asyncHandler(authController.me)
);

module.exports = router;