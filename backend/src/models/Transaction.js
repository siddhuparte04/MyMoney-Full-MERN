import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['Income', 'Expense', 'Lent', 'Repayment'], required: true },
  note: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
export default mongoose.model('Transaction', transactionSchema);