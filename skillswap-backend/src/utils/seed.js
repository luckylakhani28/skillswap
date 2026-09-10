/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Category = require('../models/Category');

const categories = [
  { name: 'Programming', icon: '💻' },
  { name: 'Design', icon: '🎨' },
  { name: 'Video Editing', icon: '🎬' },
  { name: 'Data Science', icon: '📊' },
  { name: 'Languages', icon: '🗣️' },
  { name: 'Music', icon: '🎵' },
  { name: 'Marketing', icon: '📈' },
  { name: 'Writing', icon: '✍️' },
];

const seed = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Skill.deleteMany({}), Category.deleteMany({})]);

  await Category.insertMany(categories);
  console.log(`Inserted ${categories.length} categories`);

  const admin = await User.create({
    name: 'Admin',
    username: 'admin',
    email: 'admin@skillswap.dev',
    password: 'admin123',
    role: 'admin',
  });

  const alice = await User.create({
    name: 'Alice Kumar',
    username: 'alice',
    email: 'alice@skillswap.dev',
    password: 'password123',
    college: 'VIT',
    skillsCanTeach: ['DSA', 'C++'],
    skillsWantToLearn: ['Video Editing'],
    experienceLevel: 'Advanced',
  });

  const bob = await User.create({
    name: 'Bob Singh',
    username: 'bob',
    email: 'bob@skillswap.dev',
    password: 'password123',
    college: 'VIT',
    skillsCanTeach: ['Video Editing', 'Premiere Pro'],
    skillsWantToLearn: ['Web Development'],
    experienceLevel: 'Intermediate',
  });

  await Skill.create([
    {
      user: alice._id,
      skillName: 'Data Structures & Algorithms',
      category: 'Programming',
      description: 'Master arrays, trees, graphs and DP with problem-solving sessions.',
      experienceLevel: 'Advanced',
      tags: ['dsa', 'cpp', 'interview'],
      mode: 'Online',
    },
    {
      user: bob._id,
      skillName: 'Video Editing with Premiere Pro',
      category: 'Video Editing',
      description: 'Learn cuts, transitions, color grading and export settings for YouTube.',
      experienceLevel: 'Intermediate',
      tags: ['premiere', 'editing', 'youtube'],
      mode: 'Both',
    },
  ]);

  console.log('Seed complete.');
  console.log('Admin login -> admin@skillswap.dev / admin123');
  console.log('User login  -> alice@skillswap.dev / password123');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
