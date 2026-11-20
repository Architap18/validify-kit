'use strict';

const { validate } = require('./validate');
const { validateRequest } = require('./middleware');
const { isValidEmail } = require('./validators/email');
const { isStrongPassword } = require('./validators/password');
const { combineSchemas } = require('./combineSchemas');

module.exports = {
  validate,
  validateRequest,
  isValidEmail,
  isStrongPassword,
  combineSchemas,
};
