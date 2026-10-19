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

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in .env and be at least 32 characters long.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'MyMoney API' }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/budget', requireAuth, budgetRoutes);
app.use('/api/loans', requireAuth, loanRoutes);
app.use('/api/goals', requireAuth, goalRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`MyMoney API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });