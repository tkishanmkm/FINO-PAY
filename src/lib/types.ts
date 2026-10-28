

export interface User {
  name: string;
  customerId: string;
  profilePicture: string; // URL or data URI
  pin: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  contact: {
    phone: string;
    email: string;
    address?: string;
  };
  upiId: string;
  dob?: string;
  pan?: string;
}

export interface Account {
  id: string;
  type: 'Savings' | 'Investment' | 'Loan' | 'Sampann current';
  accountNumber: string;
  balance: number;
  currency: 'INR';
  ifsc?: string;
  branchName?: string;
  nominee?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 string
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'UPI' | 'IMPS' | 'Card Payment' | 'Food' | 'Shopping' | 'Travel' | 'Bills' | 'Other';
  from?: string;
  to?: string;
  balanceAfter: number;
  note?: string;
}

export interface Payee {
  id: string;
  name: string;
  upiId: string;
  accountNumber?: string;
  ifsc?: string;
  avatar: string; // URL or data URI
  bankName?: string;
  nickname?: string;
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string; // ISO 8601 string
}

export interface AppSettings {
  loginBanner: string; // URL or data URI
  getStatementBanner?: string; // URL or data URI
  promoBanners: { id: string; image: string; link: string }[];
  dashboardBanner?: string;
  appLogo?: string;
  appLogo2?: string;
  messageAvatar?: string;
  qrCodeImage?: string;
  personalLoanBanner?: string;
  twoWheelerLoanBanner?: string;
  statementHeaderBanner?: string;
  statementMiddleBanner?: string;
  transactionLimits?: {
    [key: string]: number;
  };
}

export interface AppData {
  user: User;
  accounts: Account[];
  transactions: Transaction[];
  payees: Payee[];
  chatMessages: ChatMessage[];
  appSettings: AppSettings;
}
