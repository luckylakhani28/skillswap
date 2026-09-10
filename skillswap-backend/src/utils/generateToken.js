const jwt = require('jsonwebtoken');

/**
 * Sign a JWT for a given user id.
 * Secret and lifetime come from the environment.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = generateToken;
