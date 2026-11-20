'use strict';

const { validate } = require('./validate');

/**
 * Returns an Express-compatible middleware that validates `req.body` against
 * the provided schema.
 *
 * - Validation passes  → calls next(). Sanitized data is available on
 *   req.sanitizedBody (and req.body is never mutated).
 * - Validation fails   → HTTP 400 with structured JSON errors.
 * - Internal errors are caught and never exposed to clients.
 *
 * @param {object} schema
 * @param {object} [options]
 * @param {boolean} [options.abortEarly=false]
 * @param {boolean} [options.strict=false]
 * @returns {Function} Express middleware: (req, res, next) => void
 */
function validateRequest(schema, options = {}) {
  return function validifyMiddleware(req, res, next) {
    try {
      const data = req.body;
      const safeData =
        data && typeof data === 'object' && !Array.isArray(data) ? data : {};

      const result = validate(safeData, schema, options);

      if (!result.valid) {
        return res.status(400).json({ valid: false, errors: result.errors });
      }

      // Expose sanitized data without mutating the original req.body.
      req.sanitizedBody = result.data;
      return next();
    } catch (_err) {
      return res.status(400).json({
        valid: false,
        errors: [{ field: '_request', message: 'Request validation failed' }],
      });
    }
  };
}

module.exports = { validateRequest };
