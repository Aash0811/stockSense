const authService = require("./auth.service");
const { successResponse } = require("../../utils/apiResponse");

async function login(req, res) {
  const { email, password } = req.validated.body;

  const result = await authService.login(email, password);

  return successResponse(
    res,
    result,
    "Login successful"
  );
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
  login,
  me,
};