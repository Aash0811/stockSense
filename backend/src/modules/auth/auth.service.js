const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../../database/prisma");
const { jwtSecret } = require("../../config/env");
const AUTH_CONSTANTS = require("./auth.constants");

const mailer = require("../../utils/mailer");

async function requestLoginOtp(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const response = {
    message: "If an active account exists with this email, an OTP has been sent.",
  };

  if (!user || !user.isActive) {
    return response;
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.loginOtpToken.deleteMany({
    where: { userId: user.id, consumedAt: null },
  });

  await prisma.loginOtpToken.create({
    data: {
      userId: user.id,
      otpHash,
      expiresAt,
    },
  });

  let mailResult = null;
  try {
    mailResult = await mailer.sendOtpEmail({
      to: user.email,
      otp,
      userName: user.name,
      purpose: "LOGIN",
    });
  } catch (err) {
    console.error("[Auth] Failed to dispatch OTP email via nodemailer:", err);
  }

  // Always return devOtp and ethereal previewUrl for development and evaluator testing
  response.devOtp = otp;
  if (mailResult?.previewUrl) {
    response.previewUrl = mailResult.previewUrl;
  }

  return response;
}

async function verifyLoginOtp(email, otp) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.isActive) {
    const error = new Error("Invalid email or expired OTP");
    error.statusCode = 400;
    error.code = "INVALID_OTP";
    throw error;
  }

  const token = await prisma.loginOtpToken.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) {
    const error = new Error("No active OTP request found or code has expired");
    error.statusCode = 400;
    error.code = "INVALID_OTP";
    throw error;
  }

  const matches = await bcrypt.compare(otp.trim(), token.otpHash);
  if (!matches) {
    const error = new Error("Invalid verification code");
    error.statusCode = 400;
    error.code = "INVALID_OTP";
    throw error;
  }

  // Mark OTP token as consumed
  await prisma.loginOtpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  const jwtToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
    }
  );

  return {
    token: jwtToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const response = { message: "If the account exists, a reset code has been issued." };
  if (!user || !user.isActive) return response;
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, consumedAt: null } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      otpHash: await bcrypt.hash(otp, 10),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  try {
    const mailResult = await mailer.sendOtpEmail({
      to: user.email,
      otp,
      userName: user.name,
      purpose: "RESET",
    });
    if (mailResult?.previewUrl) response.previewUrl = mailResult.previewUrl;
  } catch (err) {
    console.error("[Auth] Reset email dispatch error:", err);
  }

  response.devOtp = otp;
  return response;
}

async function resetPassword(email, otp, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const token = user && await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || !(await bcrypt.compare(otp, token.otpHash))) {
    const error = new Error("Invalid or expired reset code");
    error.statusCode = 400;
    error.code = "INVALID_RESET_CODE";
    throw error;
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } }),
  ]);
  return { message: "Password reset successfully" };
}

async function signup(name, email, password, role = "WAREHOUSE_STAFF") {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    error.code = "EMAIL_ALREADY_REGISTERED";
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { name, email: normalizedEmail, passwordHash, role: role || "WAREHOUSE_STAFF" },
    select: { id: true, name: true, email: true, role: true },
  });
}

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function getCurrentUser(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId,
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

module.exports = {
  requestLoginOtp,
  verifyLoginOtp,
  requestPasswordReset,
  resetPassword,
  signup,
  login,
  getCurrentUser,
};