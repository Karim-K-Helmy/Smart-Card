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

const signPasswordResetToken = ({ id, email, role, accountModel, phone }) =>
  jwt.sign(
    {
      id,
      email,
      role,
      accountModel,
      phone,
      purpose: 'password_reset',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '15m' }
  );

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Unauthorized: token expired or invalid', 401);
  }
};

const verifyPasswordResetToken = (token) => {
  const decoded = verifyToken(token);
  if (decoded.purpose !== 'password_reset') {
    throw new AppError('Invalid password reset token', 401);
  }
  return decoded;
};

module.exports = {
  signUserToken,
  signAdminToken,
  signPasswordResetToken,
  verifyToken,
  verifyPasswordResetToken,
};
