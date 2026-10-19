import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type && ['Income', 'Expense', 'Lent', 'Repayment'].includes(req.query.type)) filter.type = req.query.type;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }
  const items = await Transaction.find(filter).sort({ date: -1 }).limit(Math.min(Number(req.query.limit) || 500, 1000));
  res.json({ transactions: items });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { date, description, category, amount, type, note } = req.body;
  const item = await Transaction.create({
    user: req.user._id, date, description, category, amount, type, note,
  });
  res.status(201).json({ transaction: item });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ message: 'Transaction not found.' });
  res.json({ transaction: item });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['date', 'description', 'category', 'amount', 'type', 'note'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const item = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, updates,
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ message: 'Transaction not found.' });
  res.json({ transaction: item });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ message: 'Transaction not found.' });
  res.json({ message: 'Transaction deleted.' });
}));

export default router;