const express = require('express');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

const router = express.Router();

// Specific routes before the dynamic :username route.
router.get('/', ctrl.getUsers);
router.get('/me/stats', protect, ctrl.getMyStats);
router.put('/me', protect, ctrl.updateProfile);
router.delete('/me', protect, ctrl.deleteAccount);
router.get('/:username', ctrl.getUserByUsername);

module.exports = router;
