const express = require('express');
const { body } = require('express-validator');
const { createIntent, paymentHistory } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/create-intent',
  authMiddleware,
  [body('jobId').isMongoId().withMessage('Valid job id is required')],
  createIntent
);

router.get('/history', authMiddleware, paymentHistory);

module.exports = router;
