require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./database/db');
const authRoutes = require('./routes/auth.routes');
const poolRoutes = require('./routes/pool.routes');
const paymentRoutes = require('./routes/payment.routes');
const webhookRoutes = require('./routes/webhook.routes');
const errorHandler = require('./middleware/error.middleware');

const { globalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Vercel) for rate limiting
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Security and Utility Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(globalLimiter);
// Webhook routes (MUST be mounted before body parsing to keep raw buffer)
app.use('/webhooks', webhookRoutes);

app.use(express.json());
app.use(cookieParser());

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running and database is connected' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handling Middleware
app.use(errorHandler);

const { startCronJobs } = require('./jobs/cron.jobs');

// Start Server
if (process.env.NODE_ENV !== 'production' || require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        startCronJobs();
    });
}

module.exports = app;
