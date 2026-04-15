const adminService = require('./admin.service');

const login = async (req, res) => {
  const data = await adminService.login(req.body);
  res.status(200).json({ success: true, message: 'تم تسجيل دخول الأدمن بنجاح', data });
};

const forgotPassword = async (req, res) => {
  const data = await adminService.requestPasswordReset();
  res.status(200).json({ success: true, message: 'تم إيقاف استعادة كلمة مرور الأدمن من هذه الواجهة', data });
};

const resetPassword = async (req, res) => {
  const data = await adminService.resetPassword(req.body.code, req.body.newPassword);
  res.status(200).json({ success: true, message: 'تم إيقاف إعادة تعيين كلمة مرور الأدمن من هذه الواجهة', data });
};

const dashboard = async (req, res) => {
  const data = await adminService.getDashboard();
  res.status(200).json({ success: true, message: 'Dashboard fetched successfully', data });
};

const notificationSummary = async (req, res) => {
  const data = await adminService.getNotificationSummary(req.admin._id);
  res.status(200).json({ success: true, message: 'Notification summary fetched successfully', data });
};

const getNotificationCount = async (req, res) => {
  const data = await adminService.getNotificationCount(req.admin._id, req.params.type);
  res.status(200).json({ success: true, message: 'Notification count fetched successfully', data });
};

const markNotificationAsRead = async (req, res) => {
  const data = await adminService.markNotificationAsRead(req.admin._id, req.params.type);
  res.status(200).json({ success: true, message: 'Notification marked as read successfully', data });
};

const getMe = async (req, res) => {
  const data = await adminService.getMe(req.admin._id);
  res.status(200).json({ success: true, message: 'Admin profile fetched successfully', data });
};

const updateMe = async (req, res) => {
  const data = await adminService.updateMe(req.admin, req.body, req.file);
  res.status(200).json({ success: true, message: 'Admin profile updated successfully', data });
};

const listAdmins = async (req, res) => {
  const data = await adminService.listAdmins();
  res.status(200).json({ success: true, message: 'Admins fetched successfully', data });
};

const createAdmin = async (req, res) => {
  const data = await adminService.createAdmin(req.admin, req.body);
  res.status(201).json({ success: true, message: 'Admin created successfully', data });
};

const updateAdmin = async (req, res) => {
  const data = await adminService.updateAdmin(req.admin, req.params.adminId, req.body);
  res.status(200).json({ success: true, message: 'Admin updated successfully', data });
};

const deleteAdmin = async (req, res) => {
  const data = await adminService.deleteAdmin(req.admin, req.params.adminId);
  res.status(200).json({ success: true, message: 'Admin deleted successfully', data });
};

const listUsers = async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.status(200).json({ success: true, message: 'Users fetched successfully', data });
};

const updateUserStatus = async (req, res) => {
  const data = await adminService.updateUserStatus(req.admin, req.params.userId, req.body);
  res.status(200).json({ success: true, message: 'User status updated successfully', data });
};

const updateUser = async (req, res) => {
  const data = await adminService.updateUser(req.admin, req.params.userId, req.body);
  res.status(200).json({ success: true, message: 'User updated successfully', data });
};

const deleteUser = async (req, res) => {
  const data = await adminService.deleteUser(req.admin, req.params.userId);
  res.status(200).json({ success: true, message: 'User deleted successfully', data });
};

const listOrders = async (req, res) => {
  const data = await adminService.listOrders(req.query);
  res.status(200).json({ success: true, message: 'Orders fetched successfully', data });
};

const listCards = async (req, res) => {
  const data = await adminService.listCards(req.query);
  res.status(200).json({ success: true, message: 'Cards fetched successfully', data });
};

const toggleCardStatus = async (req, res) => {
  const data = await adminService.toggleCardStatus(req.admin, req.params.cardId, req.body.isActive);
  res.status(200).json({ success: true, message: 'Card status updated successfully', data });
};

const listActions = async (req, res) => {
  const data = await adminService.listActions(req.query);
  res.status(200).json({ success: true, message: 'Admin actions fetched successfully', data });
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  dashboard,
  notificationSummary,
  getNotificationCount,
  markNotificationAsRead,
  getMe,
  updateMe,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listUsers,
  updateUserStatus,
  updateUser,
  deleteUser,
  listOrders,
  listCards,
  toggleCardStatus,
  listActions,
};
