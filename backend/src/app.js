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
const categoryRoutes = require("./modules/categories/category.routes");
const productRoutes = require("./modules/products/product.routes");
const warehouseRoutes = require("./modules/warehouses/warehouse.routes");
const locationRoutes = require("./modules/locations/location.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const purchasingRoutes = require("./modules/purchasing/purchasing.routes");

const receivingRoutes = require("./modules/receiving/receiving.routes");
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
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-orders",purchasingRoutes);
app.use("/api/receipts",receivingRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;