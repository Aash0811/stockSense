const userService = require("./user.service");
const { successResponse } = require("../../utils/apiResponse");

async function listUsers(req, res) {
  const users = await userService.getAllUsers();
  return successResponse(res, users, "Users retrieved successfully");
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Name and email are required" },
    });
  }

  const user = await userService.createUser({ name, email, password, role });
  return successResponse(res, user, "User created successfully", 201);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const user = await userService.updateUser(id, req.body);
  return successResponse(res, user, "User updated successfully");
}

async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await userService.deleteUser(id, req.user.userId);
  return successResponse(res, user, "User deactivated successfully");
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
