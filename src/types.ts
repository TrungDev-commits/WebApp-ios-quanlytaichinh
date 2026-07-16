export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  wallet: string;
  isRecurring?: boolean;
  frequency?: 'none' | 'weekly' | 'monthly';
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface DebtTimelineItem {
  date: string;
  amount: number;
  completed: boolean;
}

export interface Debt {
  id: string;
  type: 'payable' | 'receivable'; // payable = đi vay, receivable = cho vay
  partner: string;
  amount: number;
  paid: number;
  interestRate: number; // % per month
  dueDate: string;
  timeline: DebtTimelineItem[];
}

export interface SavingsGoal {
  id: string;
  title: string;
  goalAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}
