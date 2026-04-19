const User = require('../../DB/Models/user.model');
const Admin = require('../../DB/Models/admin.model');
const { verifyToken } = require('../services/token.service');
const { AppError, asyncHandler } = require('../utils/errorhandling');

const hasPathSegment = (value = '', segment = '') => new RegExp(`(^|/)${segment}(/|$)`).test(String(value || ''));
const isAdminRoute = (req) => hasPathSegment(req.originalUrl || req.baseUrl || req.path || '', 'admin');
const isUserRoute = (req) => {
  const path = String(req.originalUrl || req.baseUrl || req.path || '');
  return !isAdminRoute(req) && hasPathSegment(path, 'users');
};

const auth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const queryToken = typeof req.query?.accessToken === 'string' ? req.query.accessToken : '';
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.split(' ')[1]
    : queryToken;

  if (!token) {
    return next(new AppError('Unauthorized: missing or invalid token', 401));
  }
  const decoded = verifyToken(token);
  const accountModel = decoded?.accountModel;

  if (!accountModel) {
    return next(new AppError('Unauthorized: invalid token payload', 401));
  }

  if (isAdminRoute(req) && accountModel !== 'Admin') {
    return next(new AppError('Forbidden: admin token required', 403));
  }

  if (isUserRoute(req) && accountModel !== 'User') {
    return next(new AppError('Forbidden: user token required', 403));
  }

  if (accountModel === 'Admin') {
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

  if (accountModel !== 'User') {
    return next(new AppError('Unauthorized: unsupported account model', 401));
  }

  const user = await User.findById(decoded.id).select('+passwordHash');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.emailVerified || user.status === 'pending') {
    return next(new AppError('This account is not activated yet', 403));
  }

  if (user.status === 'deleted') {
    return next(new AppError('هذا الحساب غير متاح حالياً.', 403, 'error', 'ACCOUNT_DELETED'));
  }

  if (user.status === 'frozen') {
    return next(new AppError('تم إيقاف حسابك، يُرجى الرجوع إلى الإدارة.', 403, 'error', 'ACCOUNT_SUSPENDED'));
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
