import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/summary', asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [transactions, loans, budget, goals] = await Promise.all([
    Transaction.find({ user: userId }).sort({ date: -1 }).limit(1000),
    Loan.find({ user: userId }),
    Budget.findOne({ user: userId }),
    Goal.find({ user: userId }),
  ]);

  const total = (type) => transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);

  const openBalance = (direction) => loans
    .filter((l) => l.direction === direction && l.status !== 'Completed')
    .reduce((sum, l) => {
      const repaid = l.repayments.reduce((s, r) => s + r.amount, 0);
      return sum + Math.max(0, l.amount - repaid);
    }, 0);

  const categoryTotals = {};
  for (const t of transactions.filter((item) => item.type === 'Expense')) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }

  res.json({
    summary: {
      totalIncome: total('Income'),
      totalExpenses: total('Expense'),
      totalLent: openBalance('Lent'),
      totalBorrowed: openBalance('Borrowed'),
      netCashFlow: total('Income') - total('Expense'),
      budget,
      goals,
      expensesByCategory: Object.entries(categoryTotals).map(([category, amount]) => ({ category, amount })),
      recentTransactions: transactions.slice(0, 10),
    },
  });
}));

export default router;