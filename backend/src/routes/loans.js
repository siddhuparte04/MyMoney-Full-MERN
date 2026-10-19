import { Router } from 'express';
import Loan from '../models/Loan.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.direction && ['Borrowed', 'Lent'].includes(req.query.direction)) filter.direction = req.query.direction;
  if (req.query.status && ['Pending', 'Partially Paid', 'Completed'].includes(req.query.status)) filter.status = req.query.status;
  const loans = await Loan.find(filter).sort({ date: -1 });
  res.json({ loans });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { person, direction, amount, date, dueDate, note, status } = req.body;
  const loan = await Loan.create({
    user: req.user._id, person, direction, amount, date, dueDate, note, status,
  });
  res.status(201).json({ loan });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['person', 'direction', 'amount', 'date', 'dueDate', 'note', 'status'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const loan = await Loan.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, updates,
    { new: true, runValidators: true }
  );
  if (!loan) return res.status(404).json({ message: 'Borrow/lend record not found.' });
  res.json({ loan });
}));

router.post('/:id/repayments', asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Repayment amount must be greater than zero.' });
  const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
  if (!loan) return res.status(404).json({ message: 'Borrow/lend record not found.' });
  const alreadyRepaid = loan.repayments.reduce((sum, item) => sum + item.amount, 0);
  if (alreadyRepaid + amount > loan.amount) {
    return res.status(400).json({ message: 'Repayment exceeds the outstanding amount.' });
  }
  loan.repayments.push({ amount, date: req.body.date || new Date(), note: req.body.note || '' });
  const totalRepaid = alreadyRepaid + amount;
  loan.status = totalRepaid >= loan.amount ? 'Completed' : 'Partially Paid';
  await loan.save();
  res.json({ loan, outstandingAmount: Math.max(0, loan.amount - totalRepaid) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!loan) return res.status(404).json({ message: 'Borrow/lend record not found.' });
  res.json({ message: 'Record deleted.' });
}));

export default router;