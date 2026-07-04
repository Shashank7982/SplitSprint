const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { createPoolRules, joinPoolRules } = require('../middleware/validate');
const {
  createPool,
  listPools,
  getMyPools,
  getPoolById,
  joinPool,
  approveMember,
  payUpi,
  verifyUpiPayment
} = require('../controllers/pool.controller');

const router = express.Router();

router.post('/', protect, createPoolRules, createPool);
router.get('/', protect, listPools);
router.get('/my-pools', protect, getMyPools); // MUST be before /:id
router.get('/:id', protect, getPoolById);
router.post('/:id/join', protect, joinPoolRules, joinPool);
router.post('/:id/approve', protect, approveMember);
router.post('/:id/pay-upi', protect, payUpi);
router.post('/:id/verify-payment', protect, verifyUpiPayment);

module.exports = router;
