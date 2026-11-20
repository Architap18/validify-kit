'use strict';

/**
 * Array field validator.
 *
 * Activated when rule.type === 'array' OR any of minItems/maxItems/uniqueItems/items
 * are present.
 *
 * Supported rule keys: type ("array"), minItems, maxItems, uniqueItems, items, message.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule
 * @param {object} options       - Forwarded validate options (e.g. abortEarly).
 * @param {Function} validateFn  - The main validate() function (injected to avoid circular deps).
 * @returns {string[]} Array of error messages (may be empty).
 */
function validateArray(field, value, rule, options, validateFn) {
  const hasArrayRule =
    rule.type === 'array' ||
    rule.minItems !== undefined ||
    rule.maxItems !== undefined ||
    rule.uniqueItems !== undefined ||
    rule.items !== undefined;

  if (!hasArrayRule) return [];

  if (value === undefined || value === null || value === '') return [];

  if (!Array.isArray(value)) {
    return [rule.message || `${field} must be an array`];
  }

  const errors = [];

  if (rule.minItems !== undefined && value.length < rule.minItems) {
    errors.push(rule.message || `${field} must have at least ${rule.minItems} item(s)`);
  }

  if (rule.maxItems !== undefined && value.length > rule.maxItems) {
    errors.push(rule.message || `${field} must have at most ${rule.maxItems} item(s)`);
  }

  if (rule.uniqueItems) {
    const seen = new Set();
    for (const item of value) {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        errors.push(rule.message || `${field} must contain unique items`);
        break;
      }
      seen.add(key);
    }
  }

  // Per-element validation using the items schema.
  if (rule.items && typeof rule.items === 'object' && !Array.isArray(rule.items)) {
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${field}.${i}`;
      // Wrap element in a temporary object so validate() can process it.
      const itemResult = validateFn({ _v: value[i] }, { _v: rule.items }, options);
      for (const e of itemResult.errors) {
        errors.push({ field: itemPath, message: e.message });
      }
    }
  }

  return errors;
}

module.exports = { validateArray };
