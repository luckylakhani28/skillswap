const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/skillController');

const router = express.Router();

const skillValidation = [
  body('skillName').trim().notEmpty().withMessage('Skill name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('experienceLevel')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid experience level'),
  body('mode').optional().isIn(['Online', 'Offline', 'Both']).withMessage('Invalid mode'),
];

router.get('/', ctrl.getSkills);
router.get('/mine', protect, ctrl.getMySkills);
router.get('/:id', ctrl.getSkillById);
router.post('/', protect, skillValidation, validate, ctrl.createSkill);
router.put('/:id', protect, ctrl.updateSkill);
router.delete('/:id', protect, ctrl.deleteSkill);

module.exports = router;
