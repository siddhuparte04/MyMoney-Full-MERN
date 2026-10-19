import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budget.js';
import loanRoutes from './routes/loans.js';
import goalRoutes from './routes/goals.js';
import dashboardRoutes from './routes/dashboard.js';

// Validate required environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set and at least 32 characters long.');
  process.exit(1);
}

const app = express();

app.disable('x-powered-by');

// Allow the deployed Netlify website and local development frontend
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header, such as server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

// Register CORS before routes and other middleware
app.use(cors(corsOptions));

// Security headers
app.use(helmet());

// Parse JSON request bodies
app.use(express.json({ limit: '100kb' }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MyMoney API',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/budget', requireAuth, budgetRoutes);
app.use('/api/loans', requireAuth, loanRoutes);
app.use('/api/goals', requireAuth, goalRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server after connecting to MongoDB
const port = Number(process.env.PORT) || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`MyMoney API is running on port ${port}`);
      console.log('Allowed frontend origins:', allowedOrigins);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
