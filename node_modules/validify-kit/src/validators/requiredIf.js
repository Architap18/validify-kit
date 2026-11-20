'use strict';

/**
 * Conditional required validator (requiredIf).
 *
 * Makes a field required when another field equals a specific value.
 *
 * rule.requiredIf: { field: string, equals: any, message?: string }
 *
 * @param {string} fieldPath - Dot-separated path of the current field.
 * @param {*} value
 * @param {object} rule
 * @param {object} data      - The full (top-level) data object.
 * @returns {string|null} Error message or null.
 */
function validateRequiredIf(fieldPath, value, rule, data) {
  if (!rule.requiredIf || typeof rule.requiredIf !== 'object') return null;

  const { field, equals } = rule.requiredIf;
  if (typeof field !== 'string') return null;

  // Condition: sibling field equals the expected value.
  if (data[field] !== equals) return null;

  // Condition is met — treat the field as required.
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '');

  if (isEmpty) {
    return rule.requiredIf.message || rule.message || `${fieldPath} is required`;
  }

  return null;
}

module.exports = { validateRequiredIf };
