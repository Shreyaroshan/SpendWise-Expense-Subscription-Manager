import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import startCronJobs from './jobs/cronJobs.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import subscriptionRoutes from './routes/subscriptions.js';
import budgetRoutes from './routes/budgets.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import categoryRoutes from './routes/categories.js';

dotenv.config();
connectDB();

const app = express();
const allowedOrigins = Array.from(
	new Set([
		...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
		'http://localhost:5173',
		'http://localhost:5174',
	].map((origin) => origin.trim()).filter(Boolean))
);

const isLocalDevOrigin = (origin) => process.env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

// Middleware FIRST
app.use(helmet());
app.use(cors({
	origin: (origin, callback) => {
		// Allow server-to-server requests and same-origin calls with no Origin header.
		if (!origin) return callback(null, true);

		if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
			return callback(null, true);
		}

		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter — brute-force protection on auth endpoints
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: 'Too many requests, please try again in 15 minutes.' },
});

// Routes AFTER middleware
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
	const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
	app.use(express.static(frontendBuildPath));

	app.get('*', (req, res, next) => {
		if (req.path.startsWith('/api')) {
			return next();
		}
		res.sendFile(path.join(frontendBuildPath, 'index.html'));
	});
} else {
	app.get('/', (req, res) => res.json({ message: 'SpendWise API running' }));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	startCronJobs();
	console.log(`Server running on port ${PORT}`);
});