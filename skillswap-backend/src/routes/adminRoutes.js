const express = require('express');
const { protect, admin } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

const router = express.Router();

// Every admin route requires a logged-in admin.
router.use(protect, admin);

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getAllUsers);
router.put('/users/:id/ban', ctrl.banUser);
router.put('/users/:id/unban', ctrl.unbanUser);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/reviews', ctrl.getAllReviews);
router.delete('/reviews/:id', ctrl.deleteReview);

module.exports = router;
