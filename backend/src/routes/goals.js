import { Router } from 'express';
import Goal from '../models/Goal.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ goals });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, targetAmount, currentAmount, targetDate } = req.body;
  const goal = await Goal.create({ user: req.user._id, name, targetAmount, currentAmount, targetDate });
  res.status(201).json({ goal });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const allowed = ['name', 'targetAmount', 'currentAmount', 'targetDate'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, updates,
    { new: true, runValidators: true }
  );
  if (!goal) return res.status(404).json({ message: 'Savings goal not found.' });
  res.json({ goal });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) return res.status(404).json({ message: 'Savings goal not found.' });
  res.json({ message: 'Goal deleted.' });
}));

export default router;