'use strict';

const { validateRequired } = require('./validators/required');
const { validateEmail } = require('./validators/email');
const { validatePassword } = require('./validators/password');
const { validateString } = require('./validators/string');
const { validateNumber } = require('./validators/number');
const { validateCustom } = require('./validators/custom');
const { validatePattern } = require('./validators/pattern');
const { validateEnum } = require('./validators/enum');
const { validateMatchesField } = require('./validators/matchesField');
const { validateArray } = require('./validators/array');
const { validateDate } = require('./validators/date');
const { validateRequiredIf } = require('./validators/requiredIf');
const { sanitizeObject } = require('./sanitize');

function isAbsent(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Checks whether any sanitization rule is present on a rule object.
 */
function hasSanitize(rule) {
  return rule.trim || rule.lowercase || rule.uppercase;
}

/**
 * Collects strict-mode errors for fields present in data but not in schema.
 * Recurses into nested objects when both the schema rule and data value are
 * plain objects.
 *
 * @param {object} data
 * @param {object} schema
 * @param {string} pathPrefix
 * @returns {Array<{ field: string, message: string }>}
 */
function collectStrictErrors(data, schema, pathPrefix) {
  const errors = [];
  for (const key of Object.keys(data)) {
    const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (!(key in schema)) {
      errors.push({ field: fieldPath, message: `${fieldPath} is not allowed` });
    } else {
      const rule = schema[key];
      const value = data[key];
      if (rule && rule.schema && value && typeof value === 'object' && !Array.isArray(value)) {
        errors.push(...collectStrictErrors(value, rule.schema, fieldPath));
      }
    }
  }
  return errors;
}

/**
 * Core recursive validation loop.
 *
 * @param {object} data         - Already-sanitized data.
 * @param {object} schema
 * @param {object} options      - { abortEarly, strict }
 * @param {string} pathPrefix   - Dot-separated prefix for nested field paths.
 * @param {object} rootData     - The top-level (unsanitized) data object for
 *                                cross-field validators such as matchesField.
 * @returns {Array<{ field: string, message: string }>}
 */
function validateObject(data, schema, options, pathPrefix, rootData) {
  const { abortEarly = false } = options;
  const errors = [];

  for (const key of Object.keys(schema)) {
    const rule = schema[key];
    const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) continue;

    const value = data[key];

    // ── requiredIf ────────────────────────────────────────────────────────
    // Evaluated before the optional short-circuit so the condition can make
    // an absent field fail.
    const reqIfError = validateRequiredIf(fieldPath, value, rule, rootData || data);
    if (reqIfError) {
      errors.push({ field: fieldPath, message: reqIfError });
      if (abortEarly) return errors;
      continue;
    }

    // ── Optional short-circuit ────────────────────────────────────────────
    if (!rule.required && isAbsent(value)) continue;

    // ── Nested object ─────────────────────────────────────────────────────
    if (rule.schema) {
      const nestedData =
        value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      const nestedErrors = validateObject(nestedData, rule.schema, options, fieldPath, rootData || data);
      for (const e of nestedErrors) {
        errors.push(e);
        if (abortEarly) return errors;
      }
      if (!isAbsent(value)) continue;
    }

    // ── Required ──────────────────────────────────────────────────────────
    const requiredError = validateRequired(fieldPath, value, rule);
    if (requiredError) {
      errors.push({ field: fieldPath, message: requiredError });
      if (abortEarly) return errors;
      continue;
    }

    // ── Email ─────────────────────────────────────────────────────────────
    const emailError = validateEmail(fieldPath, value, rule);
    if (emailError) {
      errors.push({ field: fieldPath, message: emailError });
      if (abortEarly) return errors;
    }

    // ── Password ──────────────────────────────────────────────────────────
    for (const msg of validatePassword(fieldPath, value, rule)) {
      errors.push({ field: fieldPath, message: msg });
      if (abortEarly) return errors;
    }

    // ── String ────────────────────────────────────────────────────────────
    for (const msg of validateString(fieldPath, value, rule)) {
      errors.push({ field: fieldPath, message: msg });
      if (abortEarly) return errors;
    }

    // ── Number ────────────────────────────────────────────────────────────
    for (const msg of validateNumber(fieldPath, value, rule)) {
      errors.push({ field: fieldPath, message: msg });
      if (abortEarly) return errors;
    }

    // ── Array ─────────────────────────────────────────────────────────────
    // validate is passed to avoid a circular require; array items use validate().
    for (const e of validateArray(fieldPath, value, rule, options, validate)) {
      if (typeof e === 'string') {
        errors.push({ field: fieldPath, message: e });
      } else {
        errors.push(e); // already { field, message } for item errors
      }
      if (abortEarly) return errors;
    }

    // ── Date ──────────────────────────────────────────────────────────────
    for (const msg of validateDate(fieldPath, value, rule)) {
      errors.push({ field: fieldPath, message: msg });
      if (abortEarly) return errors;
    }

    // ── Pattern ───────────────────────────────────────────────────────────
    const patternError = validatePattern(fieldPath, value, rule);
    if (patternError) {
      errors.push({ field: fieldPath, message: patternError });
      if (abortEarly) return errors;
    }

    // ── Enum ──────────────────────────────────────────────────────────────
    const enumError = validateEnum(fieldPath, value, rule);
    if (enumError) {
      errors.push({ field: fieldPath, message: enumError });
      if (abortEarly) return errors;
    }

    // ── matchesField ──────────────────────────────────────────────────────
    const matchError = validateMatchesField(fieldPath, value, rule, rootData || data);
    if (matchError) {
      errors.push({ field: fieldPath, message: matchError });
      if (abortEarly) return errors;
    }

    // ── Custom ────────────────────────────────────────────────────────────
    const customError = validateCustom(fieldPath, value, rule);
    if (customError) {
      errors.push({ field: fieldPath, message: customError });
      if (abortEarly) return errors;
    }
  }

  return errors;
}

/**
 * Validates (and optionally sanitizes) a plain data object against a schema.
 *
 * Returns:
 *   { valid: boolean, errors: Array<{ field, message }>, data: object }
 *
 * `result.data` is always present:
 *   - When sanitization rules (trim/lowercase/uppercase) exist in the schema,
 *     it is a sanitized copy of the input.
 *   - Otherwise it is the original input object (never mutated).
 *
 * @param {object} data
 * @param {object} schema
 * @param {object} [options]
 * @param {boolean} [options.abortEarly=false]
 * @param {boolean} [options.strict=false]      - Reject undeclared fields.
 * @returns {{ valid: boolean, errors: Array<{ field: string, message: string }>, data: object }}
 */
function validate(data, schema, options = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ field: '_input', message: 'Data must be a plain object' }],
      data: data,
    };
  }

  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return {
      valid: false,
      errors: [{ field: '_schema', message: 'Schema must be a plain object' }],
      data: data,
    };
  }

  // Sanitize before validation so validators see the cleaned values.
  const sanitized = sanitizeObject(data, schema);

  const errors = validateObject(sanitized, schema, options, '', sanitized);

  // Strict mode: reject fields not declared in the schema.
  if (options.strict) {
    errors.push(...collectStrictErrors(sanitized, schema, ''));
  }

  return { valid: errors.length === 0, errors, data: sanitized };
}

module.exports = { validate };
