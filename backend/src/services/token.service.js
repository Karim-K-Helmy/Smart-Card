const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorhandling');

const signUserToken = (userId) =>
  jwt.sign(
    {
      id: userId,
      role: 'user',
      accountModel: 'User',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const signAdminToken = (admin) =>
  jwt.sign(
    {
      id: admin._id,
      role: (admin.role || 'admin').toLowerCase(),
      accountModel: 'Admin',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Unauthorized: token expired or invalid', 401);
  }
};

module.exports = {
  signUserToken,
  signAdminToken,
  verifyToken,
};
