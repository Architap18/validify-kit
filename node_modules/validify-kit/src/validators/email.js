'use strict';

/**
 * RFC 5322–inspired email regex. Covers the vast majority of real-world
 * addresses without being permissive enough to accept clearly invalid ones.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Returns true when the value looks like a valid email address.
 *
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Email field validator.
 *
 * @param {string} field - Field name being validated.
 * @param {*} value - The value to check.
 * @param {object} rule - The rule configuration ({ email, message }).
 * @returns {string|null} Error message, or null if valid.
 */
function validateEmail(field, value, rule) {
  if (!rule.email) return null;

  // Skip if value is absent; let the required validator handle that case.
  if (value === undefined || value === null || value === '') return null;

  if (!isValidEmail(value)) {
    return rule.message || `${field} must be a valid email address`;
  }

  return null;
}

module.exports = { validateEmail, isValidEmail };
