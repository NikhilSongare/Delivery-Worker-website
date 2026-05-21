const express = require('express');
const { body, param } = require('express-validator');
const {
  estimateJob,
  listJobs,
  createJob,
  getJob,
  acceptJob,
  updateJobStatus,
  cancelJob,
} = require('../controllers/jobController');
const { authMiddleware } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/estimate',
  [
    body('pickup.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid pickup lat required'),
    body('pickup.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid pickup lng required'),
    body('delivery.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid delivery lat required'),
    body('delivery.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid delivery lng required'),
  ],
  estimateJob
);

router.get('/', listJobs);

router.post(
  '/',
  roleCheck('customer'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('packageSize').isIn(['small', 'medium', 'large']).withMessage('Invalid package size'),
    body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
    body('pickupLng').isFloat({ min: -180, max: 180 }).withMessage('Pickup coordinates required'),
    body('pickupLat').isFloat({ min: -90, max: 90 }).withMessage('Pickup coordinates required'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('deliveryLng').isFloat({ min: -180, max: 180 }).withMessage('Delivery coordinates required'),
    body('deliveryLat').isFloat({ min: -90, max: 90 }).withMessage('Delivery coordinates required'),
    body('price').optional().isFloat({ min: 0 }),
    body('distanceKm').optional().isFloat({ min: 0 }),
    body('estimatedTimeMin').optional().isInt({ min: 0 }),
  ],
  createJob
);

router.get('/:id', [param('id').isMongoId().withMessage('Invalid job id')], getJob);

router.patch(
  '/:id/accept',
  roleCheck('worker'),
  [param('id').isMongoId().withMessage('Invalid job id')],
  acceptJob
);

router.patch(
  '/:id/status',
  roleCheck('worker'),
  [
    param('id').isMongoId().withMessage('Invalid job id'),
    body('status').isIn(['picked-up', 'delivered']).withMessage('Invalid status'),
  ],
  updateJobStatus
);

router.delete(
  '/:id',
  roleCheck('customer'),
  [param('id').isMongoId().withMessage('Invalid job id')],
  cancelJob
);

module.exports = router;
