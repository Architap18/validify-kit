'use strict';

/*
 * Phone number regex: /^\+?(\d[\s-]?){7,15}\d$/
 *
 * Breakdown:
 *   ^           – anchor at start
 *   \+?         – optional leading + for international prefix (e.g. +91, +1)
 *   (\d[\s-]?)  – one digit optionally followed by a single space or hyphen;
 *                 this group is repeated 7–15 times, keeping the total digit
 *                 count in the range 8–16 when combined with the final \d
 *   {7,15}      – repeat the digit+separator group at least 7 and at most 15 times
 *   \d          – one final digit (ensures the number ends on a digit, not a separator)
 *   $           – anchor at end
 *
 * What this accepts:
 *   +91 98765 43210   (India, with spaces)
 *   +1 800 555 0100   (US, with spaces)
 *   +44 20 7946 0958  (UK, with spaces)
 *   9876543210        (10-digit local, no prefix)
 *
 * What this rejects:
 *   800 555 0100 48758   – too many digits (> 15)
 *   123                  – too few digits (< 8 total)
 *   abcdefghij           – letters not allowed
 *   +91 98765 ABC10      – mixed letters not allowed
 *   ++91 9876543210      – double ++ rejected (only one \+? allowed)
 *   +91 98765 43210 12345 – excessively long (> 15 digits)
 */
const PHONE_PATTERN = /^\+?(\d[\s-]?){7,15}\d$/;

const userRegistrationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 80,
    trim: true,              // sanitize: strips surrounding whitespace
    message: 'Full name must be between 3 and 80 characters',
  },

  email: {
    required: true,
    email: true,             // RFC-format check
    message: 'Please provide a valid email address',
  },

  password: {
    required: true,
    minLength: 8,
    uppercase: true,         // must contain ≥1 uppercase letter
    lowercase: true,         // must contain ≥1 lowercase letter
    number: true,            // must contain ≥1 digit
    specialChar: true,       // must contain ≥1 special character
  },

  age: {
    required: true,
    type: 'number',
    min: 18,
    max: 120,
    message: 'Age must be a number between 18 and 120',
  },

  phone: {
    required: true,
    type: 'string',
    /*
     * Uses PHONE_PATTERN (see comment above):
     *   - Optional leading +
     *   - 8–16 total digits (7–15 repetitions of digit+separator, plus one
     *     final digit = 8 to 16 digits total)
     *   - Separators: single space or hyphen between digits only
     *   - No letters, no double +, no trailing separator
     */
    pattern: PHONE_PATTERN,
    trim: true,              // sanitize: strips surrounding whitespace
    message: 'Please provide a valid phone number (8–16 digits, optional + prefix, spaces or hyphens as separators)',
  },

  skills: {
    required: true,
    type: 'array',
    minItems: 1,
    message: 'Please add at least one skill',
  },
};

const validateSchema = {
  name: {
    type: 'string',
    minLength: 3,
    maxLength: 80,
    trim: true,
  },

  email: {
    email: true,
  },

  password: {
    minLength: 8,
    uppercase: true,
    lowercase: true,
    number: true,
    specialChar: true,
  },

  age: {
    type: 'number',
    min: 18,
    max: 120,
  },

  phone: {
    type: 'string',
    pattern: PHONE_PATTERN,
    trim: true,
  },

  skills: {
    type: 'array',
    minItems: 1,
  },
};

module.exports = { userRegistrationSchema, validateSchema };
