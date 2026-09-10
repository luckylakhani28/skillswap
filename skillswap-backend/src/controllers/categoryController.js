const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/categories  (public)
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, count: categories.length, categories });
});

// @route POST /api/categories  (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  const category = await Category.create({ name, description, icon });
  res.status(201).json({ success: true, category });
});

// @route PUT /api/categories/:id  (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  ['name', 'description', 'icon'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  await category.save();
  res.json({ success: true, category });
});

// @route DELETE /api/categories/:id  (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
