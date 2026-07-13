import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true },
  icon: { type: String, default: '📦' },
  color: { type: String, default: '#6366f1' },
  type: { type: String, enum: ['expense', 'subscription', 'both'], default: 'both' },
  isDefault: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);