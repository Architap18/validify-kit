'use strict';

/**
 * Cross-field (matchesField) validator.
 *
 * Checks that the current field's value is strictly equal to another field's
 * value in the same data object.
 *
 * rule.matchesField must be a string — the name of the sibling field to match.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule      - ({ matchesField: string, message?: string })
 * @param {object} data      - The full data object being validated.
 * @returns {string|null} Error message, or null if valid.
 */
function validateMatchesField(field, value, rule, data) {
  if (typeof rule.matchesField !== 'string') return null;

  if (value === undefined || value === null || value === '') return null;

  if (value !== data[rule.matchesField]) {
    return rule.message || `${field} must match ${rule.matchesField}`;
  }

  return null;
}

module.exports = { validateMatchesField };
