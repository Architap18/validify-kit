'use strict';

const express = require('express');
const { validateRequest } = require('validify-kit');
const { userRegistrationSchema } = require('../validators/userSchema');
const { registerUser, validateArbitrary, healthCheck } = require('../controllers/userController');

const router = express.Router();

// GET /api/health
router.get('/health', healthCheck);

// POST /api/register  — middleware validates, controller handles success
router.post('/register', validateRequest(userRegistrationSchema), registerUser);

// POST /api/validate  — raw testing endpoint, no middleware gate
router.post('/validate', validateArbitrary);

module.exports = router;
