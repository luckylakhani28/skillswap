const express = require('express');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.get('/conversations', ctrl.getConversations);
router.get('/:userId', ctrl.getThread);

module.exports = router;
