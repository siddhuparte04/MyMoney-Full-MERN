import mongoose from 'mongoose';

const repaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, default: Date.now },
  note: { type: String, trim: true, maxlength: 300, default: '' },
}, { _id: true });

const loanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  person: { type: String, required: true, trim: true, maxlength: 100 },
  direction: { type: String, enum: ['Borrowed', 'Lent'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, default: null },
  note: { type: String, trim: true, maxlength: 500, default: '' },
  repayments: { type: [repaymentSchema], default: [] },
  status: { type: String, enum: ['Pending', 'Partially Paid', 'Completed'], default: 'Pending' },
}, { timestamps: true });

loanSchema.virtual('repaidAmount').get(function () {
  return this.repayments.reduce((sum, item) => sum + item.amount, 0);
});
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });
loanSchema.index({ user: 1, date: -1 });
export default mongoose.model('Loan', loanSchema);