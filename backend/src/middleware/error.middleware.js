const { errorResponse } = require("../utils/apiResponse");

function notFoundHandler(req, res) {
  return errorResponse(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    "ROUTE_NOT_FOUND"
  );
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ZodError") {
    return errorResponse(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      err.errors
    );
  }

  return errorResponse(
    res,
    err.message || "Internal server error",
    err.statusCode || 500,
    err.code || "INTERNAL_SERVER_ERROR"
  );
}

module.exports = {
  notFoundHandler,
  errorHandler,
};