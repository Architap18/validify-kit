'use strict';

const { validate } = require('validify-kit');
const { validateSchema } = require('../validators/userSchema');

function registerUser(req, res) {
  try {
    const sanitized = req.sanitizedBody;

    const normalizedEmail = typeof sanitized.email === 'string'
      ? sanitized.email.toLowerCase()
      : sanitized.email;

    const { password: _pw, ...safeUser } = sanitized;
    safeUser.email = normalizedEmail;

    return res.status(201).json({
      valid: true,
      message: 'Registration successful! Validify Kit validated and sanitized your input.',
      user: safeUser,
      sanitizationApplied: {
        name:  'trimmed (via validify-kit trim: true)',
        email: 'lowercased (applied in controller; see schema notes)',
        phone: 'trimmed (via validify-kit trim: true)',
        note:  'req.body was NOT mutated — sanitized data was in req.sanitizedBody',
      },
    });
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
}

function validateArbitrary(req, res) {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};

    const result = validate(data, validateSchema);

    const { password: _pw, ...safeData } = result.data || {};

    return res.status(result.valid ? 200 : 400).json({
      valid: result.valid,
      errors: result.errors,
      sanitizedData: safeData,
    });
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
}
function healthCheck(_req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'validify-kit-demo',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { registerUser, validateArbitrary, healthCheck };
