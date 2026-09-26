const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { clientUrl } = require("./config/env");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();
const authRoutes = require("./modules/auth/auth.routes");
// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ============================================================
// HEALTH
// ============================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StockSense backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROOT
// ============================================================

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "StockSense API",
    version: "1.0.0",
  });
});
app.use("/api/auth", authRoutes);
// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;