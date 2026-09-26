const authService = require("./auth.service");
const { successResponse } = require("../../utils/apiResponse");

async function signup(req, res) {
  const { name, email, password, role } = req.validated.body;
  const user = await authService.signup(name, email, password, role);
  return successResponse(res, user, "Account created successfully", 201);
}

async function requestPasswordReset(req, res) {
  const result = await authService.requestPasswordReset(req.validated.body.email);
  return successResponse(res, result);
}

async function resetPassword(req, res) {
  const { email, otp, password } = req.validated.body;
  const result = await authService.resetPassword(email, otp, password);
  return successResponse(res, result);
}

async function login(req, res) {
  const { email, password } = req.validated.body;

  const result = await authService.login(email, password);

  return successResponse(
    res,
    result,
    "Login successful"
  );
}

async function requestLoginOtp(req, res) {
  const { email } = req.validated.body;
  const result = await authService.requestLoginOtp(email);
  return successResponse(res, result, "Login OTP dispatched successfully");
}

async function verifyLoginOtp(req, res) {
  const { email, otp } = req.validated.body;
  const result = await authService.verifyLoginOtp(email, otp);
  return successResponse(res, result, "Login successful");
}

async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.userId);

  return successResponse(
    res,
    user,
    "User retrieved successfully"
  );
}

module.exports = {
  signup,
  requestPasswordReset,
  resetPassword,
  login,
  requestLoginOtp,
  verifyLoginOtp,
  me,
};