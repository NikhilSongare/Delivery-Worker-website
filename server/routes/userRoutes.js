const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, nearbyWorkers } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('profilePic').optional().isString(),
    body('vehicleType').optional().trim(),
    body('isAvailable').optional().isBoolean(),
    body('location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('location.lng').optional().isFloat({ min: -180, max: 180 }),
  ],
  updateProfile
);

router.get('/nearby', nearbyWorkers);

module.exports = router;
