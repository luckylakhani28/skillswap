const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('swapRequest').isMongoId().withMessage('Valid swap request id required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ],
  validate,
  ctrl.createReview
);

router.get('/user/:userId', ctrl.getUserReviews);

module.exports = router;
