import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  billingCycle: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  nextBillingDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  notes: { type: String },
}, { timestamps: true });

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);