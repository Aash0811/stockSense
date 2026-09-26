const bcrypt = require("bcryptjs");
const prisma = require("../../database/prisma");

async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          stockMovements: true,
          createdPOs: true,
          stockAdjustments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createUser({ name, email, password, role }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const error = new Error("An account with this email address already exists");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password || "admin123", 10);

  return prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || "WAREHOUSE_STAFF",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function updateUser(id, { name, role, isActive, password }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

async function deleteUser(id, currentUserId) {
  if (id === currentUserId) {
    const error = new Error("You cannot delete or deactivate your own admin account");
    error.statusCode = 400;
    error.code = "CANNOT_DELETE_SELF";
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  // Soft delete / deactivate to maintain ledger foreign-key audit integrity
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, isActive: true },
  });
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
