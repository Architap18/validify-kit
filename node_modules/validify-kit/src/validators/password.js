'use strict';

/**
 * Returns true when the password satisfies all requested criteria.
 *
 * @param {string} password
 * @param {object} [options]
 * @param {number}  [options.minLength=8]
 * @param {boolean} [options.uppercase=false]
 * @param {boolean} [options.lowercase=false]
 * @param {boolean} [options.number=false]
 * @param {boolean} [options.specialChar=false]
 * @returns {{ valid: boolean, errors: string[] }}
 */
function isStrongPassword(password, options = {}) {
  const errors = [];

  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }

  const {
    minLength = 8,
    uppercase = false,
    lowercase = false,
    number = false,
    specialChar = false,
  } = options;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (uppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (lowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (number && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (specialChar && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Password field validator (schema-driven).
 *
 * This validator is intentionally activated only when at least one
 * password-strength rule key (uppercase, lowercase, number, specialChar) is
 * present. That distinguishes a "password" field from a plain string field
 * that merely sets minLength/maxLength — the string validator handles the
 * latter.
 *
 * Supported rule keys: minLength, uppercase, lowercase, number, specialChar, message.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule
 * @returns {string[]} Array of error messages (may be empty).
 */
function validatePassword(field, value, rule) {
  // Only activate when at least one strength rule key is present.
  const strengthRuleKeys = ['uppercase', 'lowercase', 'number', 'specialChar'];
  const hasPasswordRule = strengthRuleKeys.some((k) => rule[k] !== undefined);

  if (!hasPasswordRule) return [];

  // Skip if value is absent; let the required validator handle that.
  if (value === undefined || value === null || value === '') return [];

  const options = {
    minLength: rule.minLength,
    uppercase: rule.uppercase,
    lowercase: rule.lowercase,
    number: rule.number,
    specialChar: rule.specialChar,
  };

  const result = isStrongPassword(value, options);

  if (!result.valid) {
    // If the user provided a single custom message, use it; otherwise use
    // per-criterion messages.
    if (rule.message) {
      return [rule.message];
    }
    return result.errors.map((msg) => `${field}: ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`);
  }

  return [];
}

module.exports = { validatePassword, isStrongPassword };
