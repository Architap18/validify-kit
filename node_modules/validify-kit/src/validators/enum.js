'use strict';

/**
 * Enum validator.
 *
 * rule.enum must be a non-empty array. The value must be strictly equal to
 * one of the allowed entries.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule - ({ enum: any[], message?: string })
 * @returns {string|null} Error message, or null if valid.
 */
function validateEnum(field, value, rule) {
  if (!Array.isArray(rule.enum) || rule.enum.length === 0) return null;

  if (value === undefined || value === null || value === '') return null;

  if (!rule.enum.includes(value)) {
    const allowed = rule.enum.map((v) => JSON.stringify(v)).join(', ');
    return rule.message || `${field} must be one of: ${allowed}`;
  }

  return null;
}

module.exports = { validateEnum };
