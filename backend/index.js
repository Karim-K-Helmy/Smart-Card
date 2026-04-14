require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./DB/connection');
const mountRoutes = require('./src/Modules/index.routes');
const { bootstrapAppData, cleanupUnverifiedAccounts } = require('./src/services/bootstrap.service');
const { notFoundHandler, globalErrorHandler } = require('./src/utils/errorhandling');

const app = express();
connectDB()
  .then(() => bootstrapAppData())
  .catch((error) => console.error('Bootstrap failed:', error.message));

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many auth requests. Please try again later.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many upload requests. Please try again later.' },
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LineStart backend is running',
    version: '3.0.0',
  });
});

app.use('/api/users/register', authLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/admin/forgot-password', authLimiter);
app.use('/api/admin/reset-password', authLimiter);
app.use('/api/payments/receipts', uploadLimiter);
app.use('/api/cards/checkout', uploadLimiter);

mountRoutes(app);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

setInterval(() => {
  cleanupUnverifiedAccounts()
    .then((result) => {
      if (result?.deletedUsers) {
        console.log(`Cleanup removed ${result.deletedUsers} inactive accounts`);
      }
    })
    .catch((error) => console.error('Cleanup failed:', error.message));
}, 12 * 60 * 60 * 1000);
