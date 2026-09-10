const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, admin } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

const router = express.Router();

router.get('/', ctrl.getCategories);

router.post(
  '/',
  protect,
  admin,
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  ctrl.createCategory
);

router.put('/:id', protect, admin, ctrl.updateCategory);
router.delete('/:id', protect, admin, ctrl.deleteCategory);

module.exports = router;
