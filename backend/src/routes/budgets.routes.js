import { Router } from 'express';
import Budget from '../models/Budget.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    let budget = await Budget.findOne({ user: req.userId });
    if (!budget) budget = await Budget.create({ user: req.userId, monthlySalary: 0, categories: [] });
    res.json({ budget });
  } catch (err) { next(err); }
});
router.put('/', async (req, res, next) => {
  try {
    const monthlySalary = Number(req.body.monthlySalary);
    if (!Number.isFinite(monthlySalary) || monthlySalary < 0) return res.status(400).json({ message: 'monthlySalary must be zero or greater.' });
    const categories = Array.isArray(req.body.categories) ? req.body.categories.map(c => ({
      name: String(c.name || '').trim(),
      amount: Number(c.amount),
      color: c.color || '#14965d'
    })) : [];
    if (categories.some(c => !c.name || !Number.isFinite(c.amount) || c.amount < 0)) {
      return res.status(400).json({ message: 'Each category needs a name and a non-negative amount.' });
    }
    const budget = await Budget.findOneAndUpdate(
      { user: req.userId }, { monthlySalary, categories }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ budget });
  } catch (err) { next(err); }
});
export default router;