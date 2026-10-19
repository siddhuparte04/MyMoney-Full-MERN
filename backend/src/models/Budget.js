import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0 },
  color: { type: String, default: '#14965d' },
}, { _id: true });

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  monthlySalary: { type: Number, min: 0, default: 0 },
  categories: { type: [categorySchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Budget', budgetSchema);