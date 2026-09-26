function successResponse(res, data = null, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(
  res,
  message = "Something went wrong",
  statusCode = 500,
  code = "INTERNAL_SERVER_ERROR",
  details = null
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = {
  successResponse,
  errorResponse,
};