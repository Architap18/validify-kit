'use strict';

/**
 * Required field validator.
 * Rejects undefined, null, and empty strings.
 *
 * @param {string} field - Field name being validated.
 * @param {*} value - The value to check.
 * @param {object} rule - The rule configuration ({ required, message }).
 * @returns {string|null} Error message, or null if valid.
 */
function validateRequired(field, value, rule) {
  if (!rule.required) return null;

  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '');

  if (isEmpty) {
    return rule.message || `${field} is required`;
  }

  return null;
}

module.exports = { validateRequired };
