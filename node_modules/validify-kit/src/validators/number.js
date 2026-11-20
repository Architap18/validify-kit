'use strict';

/**
 * Number field validator.
 *
 * Supported rule keys: type ("number"), min, max, message.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule
 * @returns {string[]} Array of error messages (may be empty).
 */
function validateNumber(field, value, rule) {
  const errors = [];

  const hasNumberRule =
    rule.type === 'number' ||
    rule.min !== undefined ||
    rule.max !== undefined;

  if (!hasNumberRule) return [];

  // Skip if value is absent; let the required validator handle that.
  if (value === undefined || value === null || value === '') return [];

  const isNumber = typeof value === 'number' && !Number.isNaN(value);

  if (!isNumber) {
    errors.push(rule.message || `${field} must be a valid number`);
    // Cannot do range checks on a non-number.
    return errors;
  }

  if (rule.min !== undefined && value < rule.min) {
    errors.push(rule.message || `${field} must be at least ${rule.min}`);
  }

  if (rule.max !== undefined && value > rule.max) {
    errors.push(rule.message || `${field} must be at most ${rule.max}`);
  }

  return errors;
}

module.exports = { validateNumber };
