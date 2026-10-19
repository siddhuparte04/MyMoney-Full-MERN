import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const query = { user: req.userId };
    if (req.query.type && ['Income','Expense','Lent'].includes(req.query.type)) query.type = req.query.type;
    if (req.query.category) query.category = String(req.query.category).slice(0,80);
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from);
      if (req.query.to) query.date.$lte = new Date(req.query.to);
    }
    if (req.query.search) {
      const escaped = String(req.query.search).slice(0,80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ description: new RegExp(escaped,'i') }, { category: new RegExp(escaped,'i') }];
    }
    const items = await Transaction.find(query).sort({ date: -1 }).limit(Math.min(Number(req.query.limit) || 500, 1000));
    res.json({ transactions: items });
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const { date, description, category, amount, type } = req.body;
    const item = await Transaction.create({ user: req.userId, date, description, category, amount, type });
    res.status(201).json({ transaction: item });
  } catch (err) { next(err); }
});
router.get('/summary', async (req, res, next) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const summary = { income: 0, expenses: 0, lent: 0, counts: { Income: 0, Expense: 0, Lent: 0 } };
    for (const row of result) {
      if (row._id === 'Income') summary.income = row.total;
      if (row._id === 'Expense') summary.expenses = row.total;
      if (row._id === 'Lent') summary.lent = row.total;
      summary.counts[row._id] = row.count;
    }
    summary.net = summary.income - summary.expenses;
    res.json({ summary });
  } catch (err) { next(err); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    const item = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ transaction: item });
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (err) { next(err); }
});
export default router;