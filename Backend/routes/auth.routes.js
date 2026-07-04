const express = require('express');
const { register, login, refresh, logout, getProfile } = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authLimiter, registerRules, register);
router.post('/login', authLimiter, loginRules, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);

module.exports = router;
