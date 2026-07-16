import mongoose from 'mongoose';

let cachedDb: typeof mongoose | null = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }
  cachedDb = await mongoose.connect(uri);
  return cachedDb;
}

const TransactionSchema = new mongoose.Schema({
  id: { type: String, default: () => 'tx-' + Math.random().toString(36).substr(2, 9) },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, default: '' },
  wallet: { type: String, default: 'Ngân hàng' },
  isRecurring: { type: Boolean, default: false },
  frequency: { type: String, enum: ['none', 'weekly', 'monthly'], default: 'none' }
}, { versionKey: false });

const BudgetSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  limit: { type: Number, required: true },
  spent: { type: Number, default: 0 }
}, { versionKey: false });

const DebtTimelineItemSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const DebtSchema = new mongoose.Schema({
  id: { type: String, default: () => 'debt-' + Math.random().toString(36).substr(2, 9) },
  type: { type: String, enum: ['payable', 'receivable'], required: true },
  partner: { type: String, required: true },
  amount: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  interestRate: { type: Number, default: 0 },
  dueDate: { type: String, required: true },
  timeline: [DebtTimelineItemSchema]
}, { versionKey: false });

const SavingsGoalSchema = new mongoose.Schema({
  id: { type: String, default: () => 'save-' + Math.random().toString(36).substr(2, 9) },
  title: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: String, required: true },
  icon: { type: String, default: 'piggy' }
}, { versionKey: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
export const Debt = mongoose.models.Debt || mongoose.model('Debt', DebtSchema);
export const SavingsGoal = mongoose.models.SavingsGoal || mongoose.model('SavingsGoal', SavingsGoalSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
