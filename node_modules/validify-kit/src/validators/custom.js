
'use strict';

/**
 * Runs a custom validation function for a field.
 *
 * The custom function receives the field value.
 * It must return true if valid and false if invalid.
 *
 * @param {string} field - Name of the field.
 * @param {*} value - Value to validate.
 * @param {object} rule - Validation rule.
 * @param {Function} rule.custom - Custom validation function.
 * @param {string} [rule.message] - Custom error message.
 * @returns {string|null} Error message if invalid, otherwise null.
 */
function validateCustom(field, value, rule) {
  // Ensure a valid custom function exists.
  if (!rule || typeof rule.custom !== 'function') {
    return null;
  }

  // Skip validation for absent or empty values.
  // The required validator handles missing values.
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return null;
  }

  try {
    const passed = rule.custom(value);

    // Only true indicates successful validation.
    if (passed !== true) {
      return rule.message || `${field} failed custom validation`;
    }

    return null;
  } catch (error) {
    // Prevent custom validator errors from crashing validation.
    return rule.message || `${field} failed custom validation`;
  }
}

module.exports = { validateCustom };
