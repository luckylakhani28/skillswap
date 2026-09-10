const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillName: { type: String, required: [true, 'Skill name is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], maxlength: 2000 },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    preferredSkills: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true, lowercase: true }],
    duration: { type: String, default: '' }, // e.g. "4 weeks", "2 sessions"
    availability: { type: String, default: '' },
    mode: {
      type: String,
      enum: ['Online', 'Offline', 'Both'],
      default: 'Online',
    },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Weighted text index powers keyword search across the main fields.
skillSchema.index(
  { skillName: 'text', description: 'text', tags: 'text', category: 'text' },
  { weights: { skillName: 5, tags: 3, category: 2, description: 1 } }
);

module.exports = mongoose.model('Skill', skillSchema);
