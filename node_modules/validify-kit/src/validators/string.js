'use strict';

/**
 * Password-specific rule keys that are handled by the password validator.
 * When any of these are present on a rule, the string validator defers
 * minLength handling to avoid duplicate errors.
 */
const PASSWORD_RULE_KEYS = ['uppercase', 'lowercase', 'number', 'specialChar'];

/**
 * String field validator.
 *
 * Supported rule keys: type ("string"), minLength, maxLength, message.
 * When password-specific rule keys are present, minLength is left to the
 * password validator to avoid producing duplicate errors.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule
 * @returns {string[]} Array of error messages (may be empty).
 */
function validateString(field, value, rule) {
  const errors = [];

  // Skip if value is absent; let the required validator handle that.
  if (value === undefined || value === null || value === '') return [];

  // Type check — only enforce when rule.type === 'string'
  if (rule.type === 'string' && typeof value !== 'string') {
    errors.push(rule.message || `${field} must be a string`);
    // Cannot check length on a non-string; bail early.
    return errors;
  }

  if (typeof value !== 'string') {
    // No string-type rule — skip string-specific length checks for non-strings.
    return [];
  }

  // If the rule has password-specific keys, skip minLength here — the password
  // validator handles it and will produce the appropriate error message.
  const isPasswordField = PASSWORD_RULE_KEYS.some((k) => rule[k] !== undefined);

  if (!isPasswordField && rule.minLength !== undefined && value.length < rule.minLength) {
    errors.push(
      rule.message || `${field} must be at least ${rule.minLength} characters long`
    );
  }

  if (rule.maxLength !== undefined && value.length > rule.maxLength) {
    errors.push(
      rule.message || `${field} must be at most ${rule.maxLength} characters long`
    );
  }

  return errors;
}

module.exports = { validateString };
