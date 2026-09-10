/**
 * Wraps an async route handler so rejected promises are passed
 * to Express's error middleware instead of crashing the process.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
