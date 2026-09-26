const express = require("express");

const authController = require("./auth.controller");
const validate = require("../../middleware/validate.middleware");
const authenticate = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const { loginSchema, signupSchema, requestResetSchema, resetPasswordSchema } = require("./auth.validation");

const router = express.Router();

router.post(
  "/signup",
  validate(signupSchema),
  asyncHandler(authController.signup)
);

router.post("/password-reset/request", validate(requestResetSchema), asyncHandler(authController.requestPasswordReset));
router.post("/password-reset/confirm", validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

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