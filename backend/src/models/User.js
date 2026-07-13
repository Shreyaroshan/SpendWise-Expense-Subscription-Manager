import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  preferences: {
    dateFormat: { type: String, enum: ['DD/MM/YYYY', 'MM/DD/YYYY'], default: 'DD/MM/YYYY' },
    weekStartsOn: { type: String, enum: ['Sunday', 'Monday'], default: 'Monday' },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  notifPrefs: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    renewalReminder: { type: Boolean, default: true },
    budgetAlert: { type: Boolean, default: true },
    budgetAlert80: { type: Boolean, default: true },
    budgetAlert100: { type: Boolean, default: true },
    monthlySummary: { type: Boolean, default: true },
    alertThreshold: { type: Number, default: 80 },
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);