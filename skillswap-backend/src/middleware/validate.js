const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Collect express-validator results and throw a 400 with the first message
 * plus the full list of field errors.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  const err = new ApiError(400, details[0].message);
  err.details = details;
  next(err);
};

module.exports = validate;
