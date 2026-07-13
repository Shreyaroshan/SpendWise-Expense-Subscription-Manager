import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  budgetYear: { type: Number, required: true, default: () => new Date().getFullYear() },
  budgetMonth: { type: Number, required: true, default: () => new Date().getMonth() + 1 },
  alertThreshold: { type: Number, default: 80 },
  isActive: { type: Boolean, default: true },
  currentPeriod: {
    spent: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  }
}, { timestamps: true });

budgetSchema.index({ userId: 1, isActive: 1 });
budgetSchema.index(
  { userId: 1, categoryId: 1, budgetYear: 1, budgetMonth: 1 },
  {
    unique: true,
    partialFilterExpression: {
      budgetYear: { $exists: true },
      budgetMonth: { $exists: true },
    },
  }
);

export default mongoose.model('Budget', budgetSchema);