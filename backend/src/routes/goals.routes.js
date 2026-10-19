import { Router } from 'express';
import Goal from '../models/Goal.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try { res.json({ goals: await Goal.find({ user: req.userId }).sort({ createdAt: -1 }) }); }
  catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount, targetDate } = req.body;
    const goal = await Goal.create({ user: req.userId, name, targetAmount, currentAmount, targetDate: targetDate || null });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = {};
    for (const key of ['name','targetAmount','currentAmount','targetDate']) {
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    }
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.userId }, allowed, { new: true, runValidators: true });
    if (!goal) return res.status(404).json({ message: 'Savings goal not found.' });
    res.json({ goal });
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ message: 'Savings goal not found.' });
    res.json({ message: 'Savings goal deleted.' });
  } catch (err) { next(err); }
});
export default router;