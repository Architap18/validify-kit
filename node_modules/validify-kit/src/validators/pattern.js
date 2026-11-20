'use strict';

/**
 * Pattern (regex) validator.
 *
 * The rule.pattern must be a RegExp. When the value does not match, an error
 * is returned. Non-string values are coerced with String() before testing so
 * that numeric fields can also be pattern-validated.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule - ({ pattern: RegExp, message?: string })
 * @returns {string|null} Error message, or null if valid.
 */
function validatePattern(field, value, rule) {
  if (!(rule.pattern instanceof RegExp)) return null;

  if (value === undefined || value === null || value === '') return null;

  if (!rule.pattern.test(String(value))) {
    return rule.message || `${field} has an invalid format`;
  }

  return null;
}

module.exports = { validatePattern };
