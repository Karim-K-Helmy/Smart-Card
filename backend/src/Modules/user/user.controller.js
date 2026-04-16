const userService = require('./user.service');

const register = async (req, res) => {
  const data = await userService.register(req.body);
  res.status(201).json({ success: true, message: 'تم إنشاء الحساب وتفعيله مباشرة', data });
};

const login = async (req, res) => {
  const data = await userService.login(req.body);
  res.status(200).json({ success: true, message: 'Login successful', data });
};

const forgotPassword = async (req, res) => {
  const data = await userService.forgotPassword(req.body.email, req.body.phone);
  res.status(200).json({ success: true, message: 'تم التحقق من بيانات الحساب. يمكنك الآن تعيين كلمة مرور جديدة.', data });
};

const resetPassword = async (req, res) => {
  const data = await userService.resetPassword(req.body.email, req.body.resetToken, req.body.newPassword);
  res.status(200).json({ success: true, message: 'تم تغيير كلمة المرور بنجاح', data });
};

const checkPhoneExists = async (req, res) => {
  const data = await userService.checkPhoneExists(req.body.phone);
  res.status(200).json({ success: true, message: 'تم التحقق من الرقم بنجاح', data });
};

const createDataRequest = async (req, res) => {
  const data = await userService.createDataRequest(req.body);
  res.status(201).json({ success: true, message: 'تم تقديم طلبك، جاري مراجعته وسوف تتلقى رسالة على الواتساب الخاص بك', data });
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
  const data = await userService.changePassword(req.user, req.body.currentPassword, req.body.newPassword);
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
  login,
  forgotPassword,
  resetPassword,
  checkPhoneExists,
  createDataRequest,
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
