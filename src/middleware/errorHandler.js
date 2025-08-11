const logger = require("../utils/logger");

// Custom error classes
const ValidationError = class extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
};

const APIError = class extends Error {
  constructor(message, details) {
    super(message);
    this.name = "APIError";
    this.status = 500;
    this.details = details;
  }
};

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const details = err.details || null;

  // Log error with Winston
  logger.error(`Error: ${message}`, {
    status,
    path: req.path,
    method: req.method,
    stack: err.stack,
    errorName: err.name || "UnknownError",
  });

  // Send error response
  res.status(status).json({
    error: message,
    details,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, ValidationError, APIError };
