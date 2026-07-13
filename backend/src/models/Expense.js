import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: [0.01, 'Amount must be a positive number'] },
  currency: { type: String, default: 'INR' },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, trim: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'netbanking', 'other'], default: 'cash' },
  receiptUrl: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringSchedule: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly', null], default: null },
}, { timestamps: true });

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });

export default mongoose.model('Expense', expenseSchema);