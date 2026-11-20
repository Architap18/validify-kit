'use strict';

/**
 * Date field validator.
 *
 * Activated when rule.type === 'date' OR minDate/maxDate are present.
 *
 * Accepts JavaScript Date objects and date strings parseable by new Date().
 * Invalid dates (e.g. "not-a-date", new Date("invalid")) are rejected.
 *
 * Supported rule keys: type ("date"), minDate, maxDate, message.
 *
 * @param {string} field
 * @param {*} value
 * @param {object} rule
 * @returns {string[]} Array of error messages (may be empty).
 */
function validateDate(field, value, rule) {
  const hasDateRule =
    rule.type === 'date' ||
    rule.minDate !== undefined ||
    rule.maxDate !== undefined;

  if (!hasDateRule) return [];

  if (value === undefined || value === null || value === '') return [];

  // Parse to Date — accept Date objects and parseable strings.
  let date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return [rule.message || `${field} must be a valid date`];
  }

  if (isNaN(date.getTime())) {
    return [rule.message || `${field} must be a valid date`];
  }

  const errors = [];

  if (rule.minDate !== undefined) {
    const min = new Date(rule.minDate);
    if (!isNaN(min.getTime()) && date < min) {
      errors.push(rule.message || `${field} must not be before ${rule.minDate}`);
    }
  }

  if (rule.maxDate !== undefined) {
    const max = new Date(rule.maxDate);
    if (!isNaN(max.getTime()) && date > max) {
      errors.push(rule.message || `${field} must not be after ${rule.maxDate}`);
    }
  }

  return errors;
}

module.exports = { validateDate };
