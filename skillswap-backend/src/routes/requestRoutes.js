const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/requestController');

const router = express.Router();

// All request routes require authentication.
router.use(protect);

router.post(
  '/',
  [
    body('offeredSkill').isMongoId().withMessage('Valid offered skill id required'),
    body('requestedSkill').isMongoId().withMessage('Valid requested skill id required'),
  ],
  validate,
  ctrl.createRequest
);

router.get('/incoming', ctrl.getIncoming);
router.get('/outgoing', ctrl.getOutgoing);
router.get('/:id', ctrl.getRequestById);

router.put('/:id/accept', ctrl.acceptRequest);
router.put('/:id/reject', ctrl.rejectRequest);
router.put('/:id/cancel', ctrl.cancelRequest);
router.put('/:id/complete', ctrl.completeRequest);

module.exports = router;
