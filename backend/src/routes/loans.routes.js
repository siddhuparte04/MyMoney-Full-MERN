import { Router } from 'express';
import Loan from '../models/Loan.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try {
    const query = { user: req.userId };
    if (req.query.direction && ['Borrowed','Lent'].includes(req.query.direction)) query.direction = req.query.direction;
    if (req.query.status && ['Pending','Partially Paid','Completed'].includes(req.query.status)) query.status = req.query.status;
    const loans = await Loan.find(query).sort({ date: -1 }).limit(1000);
    res.json({ loans });
  } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const { person, amount, direction, date, dueDate, status, note, phone } = req.body;
    const loan = await Loan.create({ user: req.userId, person, amount, direction, date, dueDate: dueDate || null, status, note, phone });
    res.status(201).json({ loan });
  } catch (err) { next(err); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = {};
    for (const key of ['person','amount','direction','date','dueDate','status','note','phone']) {
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    }
    const loan = await Loan.findOneAndUpdate({ _id: req.params.id, user: req.userId }, allowed, { new: true, runValidators: true });
    if (!loan) return res.status(404).json({ message: 'Loan record not found.' });
    res.json({ loan });
  } catch (err) { next(err); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan record not found.' });
    res.json({ message: 'Loan record deleted.' });
  } catch (err) { next(err); }
});
export default router;