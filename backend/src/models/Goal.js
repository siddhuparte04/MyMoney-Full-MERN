import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100, default: 'Emergency Fund' },
  targetAmount: { type: Number, required: true, min: 1 },
  currentAmount: { type: Number, min: 0, default: 0 },
  targetDate: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);