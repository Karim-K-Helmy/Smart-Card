const userService = require('./user.service');

const register = async (req, res) => {
  const data = await userService.register(req.body);
  res.status(201).json({ success: true, message: 'تم إنشاء الحساب وإرسال كود التفعيل إلى البريد الإلكتروني', data });
};

const verifyActivation = async (req, res) => {
  const data = await userService.verifyActivation(req.body.email, req.body.code);
  res.status(200).json({ success: true, message: 'تم تفعيل الحساب بنجاح', data });
};

const resendActivation = async (req, res) => {
  const data = await userService.resendActivation(req.body.email);
  res.status(200).json({ success: true, message: 'تم إرسال كود تفعيل جديد', data });
};

const requestLoginCode = async (req, res) => {
  const data = await userService.requestLoginCode(req.body);
  res.status(200).json({ success: true, message: 'تم إرسال كود تسجيل الدخول', data });
};

const verifyLoginCode = async (req, res) => {
  const data = await userService.verifyLoginCode(req.body);
  res.status(200).json({ success: true, message: 'تم تسجيل الدخول بنجاح', data });
};

// تسجيل الدخول العادي بالإيميل والباسورد
const login = async (req, res) => {
  const data = await userService.login(req.body);
  res.status(200).json({ success: true, message: 'Login successful', data });
};

const forgotPassword = async (req, res) => {
  const data = await userService.forgotPassword(req.body.email);
  res.status(200).json({ success: true, message: 'تم إرسال كود استعادة كلمة المرور', data });
};

const resetPassword = async (req, res) => {
  const data = await userService.resetPassword(req.body.email, req.body.code, req.body.newPassword);
  res.status(200).json({ success: true, message: 'تم تغيير كلمة المرور بنجاح', data });
};

const requestSensitiveOtp = async (req, res) => {
  const data = await userService.requestSensitiveOtp(req.user, req.body.purpose);
  res.status(200).json({ success: true, message: 'تم إرسال كود التأكيد إلى بريدك الإلكتروني', data });
};

const getMyProfile = async (req, res) => {
  const data = await userService.getMyProfile(req.user._id);
  res.status(200).json({ success: true, message: 'Profile fetched successfully', data });
};

const getMyNotifications = async (req, res) => {
  const data = await userService.getMyNotifications(req.user);
  res.status(200).json({ success: true, message: 'Notifications fetched successfully', data });
};

const getMyNotificationCount = async (req, res) => {
  const data = await userService.getMyNotificationCount(req.user, req.params.type);
  res.status(200).json({ success: true, message: 'Notification count fetched successfully', data });
};

const markMyNotificationAsRead = async (req, res) => {
  const data = await userService.markMyNotificationAsRead(req.user, req.params.type);
  res.status(200).json({ success: true, message: 'Notification marked as read successfully', data });
};

const updateProfile = async (req, res) => {
  const data = await userService.updateProfile(req.user, req.body, req.files);
  res.status(200).json({ success: true, message: 'Profile updated successfully', data });
};

const changePassword = async (req, res) => {
  const data = await userService.changePassword(req.user, req.body.currentPassword, req.body.newPassword, req.body.otpCode);
  res.status(200).json({ success: true, message: 'Password changed successfully', data });
};

const createProduct = async (req, res) => {
  const data = await userService.createProduct(req.user, req.body, req.files);
  res.status(201).json({ success: true, message: 'Product created successfully', data });
};

const getMyProducts = async (req, res) => {
  const data = await userService.getMyProducts(req.user);
  res.status(200).json({ success: true, message: 'Products fetched successfully', data });
};

const updateProduct = async (req, res) => {
  const data = await userService.updateProduct(req.user, req.params.productId, req.body, req.files);
  res.status(200).json({ success: true, message: 'Product updated successfully', data });
};

const deleteProduct = async (req, res) => {
  const data = await userService.deleteProduct(req.user, req.params.productId);
  res.status(200).json({ success: true, message: 'Product deleted successfully', data });
};

const getPublicProfile = async (req, res) => {
  const data = await userService.getPublicProfile(req.params.slug);
  res.status(200).json({ success: true, message: 'Public profile fetched successfully', data });
};

module.exports = {
  register,
  verifyActivation,
  resendActivation,
  requestLoginCode,
  verifyLoginCode,
  login,
  forgotPassword,
  resetPassword,
  requestSensitiveOtp,
  getMyProfile,
  getMyNotifications,
  getMyNotificationCount,
  markMyNotificationAsRead,
  updateProfile,
  changePassword,
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getPublicProfile,
};
