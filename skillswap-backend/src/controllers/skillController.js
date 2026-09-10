const Skill = require('../models/Skill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Allowed sort options mapped to Mongo sort specs.
const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { skillName: 1 },
};

// @route GET /api/skills  — browse with search/filter/sort/pagination
const getSkills = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);
  const filter = { isActive: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.experienceLevel) filter.experienceLevel = req.query.experienceLevel;
  if (req.query.mode) filter.mode = req.query.mode;
  if (req.query.availability) filter.availability = new RegExp(req.query.availability, 'i');

  // Text search on the compound index; fall back to regex on the name.
  if (req.query.search) {
    filter.$or = [
      { skillName: new RegExp(req.query.search, 'i') },
      { tags: new RegExp(req.query.search, 'i') },
      { description: new RegExp(req.query.search, 'i') },
    ];
  }

  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [skills, total] = await Promise.all([
    Skill.find(filter)
      .populate('user', 'name username profilePicture rating')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Skill.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: skills.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    skills,
  });
});

// @route GET /api/skills/mine  — current user's listings
const getMySkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: skills.length, skills });
});

// @route GET /api/skills/:id
const getSkillById = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id).populate(
    'user',
    'name username profilePicture rating numReviews college'
  );
  if (!skill) throw new ApiError(404, 'Skill not found');
  res.json({ success: true, skill });
});

// @route POST /api/skills
const createSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, skill });
});

// Ensure the current user owns the skill.
const findOwnedSkill = async (id, userId) => {
  const skill = await Skill.findById(id);
  if (!skill) throw new ApiError(404, 'Skill not found');
  if (skill.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only modify your own listings');
  }
  return skill;
};

// @route PUT /api/skills/:id
const updateSkill = asyncHandler(async (req, res) => {
  const skill = await findOwnedSkill(req.params.id, req.user._id);
  const fields = [
    'skillName', 'category', 'description', 'experienceLevel', 'preferredSkills',
    'tags', 'duration', 'availability', 'mode', 'image', 'isActive',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) skill[f] = req.body[f];
  });
  await skill.save();
  res.json({ success: true, skill });
});

// @route DELETE /api/skills/:id
const deleteSkill = asyncHandler(async (req, res) => {
  await findOwnedSkill(req.params.id, req.user._id);
  await Skill.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Skill deleted' });
});

module.exports = {
  getSkills,
  getMySkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
};
