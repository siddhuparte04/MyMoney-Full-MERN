import { Router } from 'express';
import Budget from '../models/Budget.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const defaults = [
  { name: 'Personal & Grooming', amount: 2000, color: '#14965d' },
  { name: 'Family', amount: 3000, color: '#2584f4' },
  { name: 'Rent & Living', amount: 4000, color: '#f06464' },
  { name: 'Food & Travel', amount: 2000, color: '#ffb020' },
  { name: 'Emergency Savings', amount: 2000, color: '#7b42d8' },
  { name: 'Other Expenses', amount: 1000, color: '#a3b2c2' },
];

router.get('/', asyncHandler(async (req, res) => {
  let budget = await Budget.findOne({ user: req.user._id });
  if (!budget) budget = await Budget.create({ user: req.user._id, monthlySalary: 14000, categories: defaults });
  res.json({ budget });
}));

router.put('/', asyncHandler(async (req, res) => {
  const { monthlySalary, categories } = req.body;
  if (!Array.isArray(categories)) return res.status(400).json({ message: 'categories must be an array.' });
  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id },
    { monthlySalary, categories },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ budget });
}));

export default router;