const AdminAction = require('../../DB/Models/adminAction.model');

const logAdminAction = async ({ adminId, userId = null, actionType, targetTable, targetId, notes = '' }) =>
  AdminAction.create({
    adminId,
    userId,
    actionType,
    targetTable,
    targetId: targetId ? String(targetId) : '',
    notes,
  });

module.exports = logAdminAction;
