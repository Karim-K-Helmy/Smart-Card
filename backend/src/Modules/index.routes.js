const userRoutes = require('./user/user.routes');
const categoryRoutes = require('./category/category.routes');
const cardRoutes = require('./card/card.routes');
const paymentRoutes = require('./payment/payment.routes');
const adminRoutes = require('./admin/admin.routes');
const messageRoutes = require('./message/message.routes');

const mountRoutes = (app) => {
  app.use('/api/users', userRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/cards', cardRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/messages', messageRoutes);
};

module.exports = mountRoutes;
