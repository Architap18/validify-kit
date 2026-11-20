'use strict';

/**
 * The same strength keys used in the password validator to activate it.
 * When any of these are present on a rule, `uppercase` and `lowercase` are
 * strength requirements — not string sanitization transforms.
 *
 * This mirrors the password validator's own activation check to stay in sync.
 */
const PASSWORD_STRENGTH_KEYS = ['uppercase', 'lowercase', 'number', 'specialChar'];

/**
 * Applies sanitization rules to a string value.
 * Returns the original value unchanged for non-strings.
 *
 * Supported rule keys:
 *   - trim     – removes leading/trailing whitespace (always safe).
 *   - lowercase – converts to lower case (skipped on password strength rules).
 *   - uppercase – converts to upper case (skipped on password strength rules).
 *
 * `lowercase` / `uppercase` are skipped when the rule is a password-strength
 * rule (i.e., any of uppercase/lowercase/number/specialChar are present),
 * because those keys double as strength requirements and the password must not
 * be case-converted before it is strength-checked.
 *
 * To use lowercase/uppercase sanitization on a non-password string field,
 * ensure none of the password strength keys appear on the same rule.
 *
 * @param {*} value
 * @param {object} rule
 * @returns {*} Sanitized value.
 */
function sanitizeValue(value, rule) {
  if (typeof value !== 'string') return value;

  // Mirror the password validator's activation check.
  const isPasswordRule = PASSWORD_STRENGTH_KEYS.some((k) => rule[k] !== undefined);

  let v = value;
  if (rule.trim) v = v.trim();
  if (!isPasswordRule && rule.lowercase) v = v.toLowerCase();
  if (!isPasswordRule && rule.uppercase) v = v.toUpperCase();
  return v;
}

/**
 * Recursively sanitizes a data object based on schema rules.
 * Never mutates the original object — always returns a new object.
 *
 * @param {object} data
 * @param {object} schema
 * @returns {object} Sanitized copy.
 */
function sanitizeObject(data, schema) {
  const result = Object.assign({}, data);

  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) continue;

    const hasSanitize = rule.trim || rule.lowercase || rule.uppercase;

    if (rule.schema && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = sanitizeObject(result[key], rule.schema);
    } else if (hasSanitize && key in result) {
      result[key] = sanitizeValue(result[key], rule);
    }
  }

  return result;
}

module.exports = { sanitizeValue, sanitizeObject };
