const User = require('../../DB/Models/user.model');
const Admin = require('../../DB/Models/admin.model');
const { verifyToken } = require('../services/token.service');
const { AppError, asyncHandler } = require('../utils/errorhandling');

const auth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: missing or invalid token', 401));
  }

  const token = authorization.split(' ')[1];
  const decoded = verifyToken(token);

  if (decoded.accountModel === 'Admin') {
    const admin = await Admin.findById(decoded.id).select('+passwordHash');
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    req.admin = admin;
    req.auth = {
      id: admin._id,
      role: (admin.role || 'admin').toLowerCase(),
      accountModel: 'Admin',
    };
    return next();
  }

  const user = await User.findById(decoded.id).select('+passwordHash');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.emailVerified || user.status === 'pending') {
    return next(new AppError('This account is not activated yet', 403));
  }

  if (user.status === 'deleted') {
    return next(new AppError('This account was deleted', 403));
  }

  if (user.status === 'frozen') {
    return next(new AppError('This account is temporarily frozen', 403));
  }

  req.user = user;
  req.auth = {
    id: user._id,
    role: 'user',
    accountModel: 'User',
  };
  return next();
});

const allowTo = (...roles) => (req, res, next) => {
  const available = [req.auth?.role, req.auth?.accountModel?.toLowerCase()].filter(Boolean);
  const allowed = roles.map((role) => String(role).toLowerCase());

  if (!available.some((value) => allowed.includes(value))) {
    return next(new AppError('Forbidden: insufficient permissions', 403));
  }

  return next();
};

module.exports = {
  auth,
  allowTo,
};
