const express = require('express');
const { body, param } = require('express-validator');
const {
  listUsers,
  patchUser,
  listAllJobs,
  cancelJobAdmin,
  listAllPayments,
  dashboard,
} = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authMiddleware, roleCheck('admin'));

router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.patch(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('isActive').isBoolean().withMessage('isActive boolean required'),
  ],
  patchUser
);
router.get('/jobs', listAllJobs);
router.patch('/jobs/:id/cancel', [param('id').isMongoId().withMessage('Invalid job id')], cancelJobAdmin);
router.get('/payments', listAllPayments);

module.exports = router;
