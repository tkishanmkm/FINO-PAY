import defaultAppSettings from './default-app-settings.json';

import type { AppData } from './types';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

export const initialData: AppData = {
  user: {
    name: 'Kishan Mishra',
    customerId: '163192179',
    profilePicture: '',
    pin: '1234',
    kycStatus: 'Verified',
    contact: {
      phone: '+919876547629',
      email: 'test.kishanmishra@gmail.com',
      address: 'A-123, Star Apartments, Galaxy Road, Mumbai, Maharashtra, 400001',
    },
    upiId: '',
    dob: '05/09/2006',
    pan: 'ABCDE1239P',
  },
  accounts: [
    {
      id: 'acc_sav_01',
      type: 'Savings',
      accountNumber: '50100123456789',
      balance: 150250.75,
      currency: 'INR',
      ifsc: 'FINO0009001',
      branchName: 'Mindspace Juinagar Plot No Gen 2/1/F',
      nominee: 'Nil',
    },
    {
      id: 'acc_inv_01',
      type: 'Investment',
      accountNumber: '60100987654321',
      balance: 500000.0,
      currency: 'INR',
    },
    {
      id: 'acc_loan_01',
      type: 'Loan',
      accountNumber: '70100112233445',
      balance: -250000.0,
      currency: 'INR',
    },
  ],
  transactions: [
    {
      id: 'txn_1',
      date: today.toISOString(),
      description: 'UPI to Zomato',
      amount: 450.0,
      type: 'debit',
      category: 'Food',
      to: 'zomato@upi',
      balanceAfter: 150250.75,
    },
    {
      id: 'txn_2',
      date: today.toISOString(),
      description: 'Salary Credit',
      amount: 75000.0,
      type: 'credit',
      category: 'Other',
      from: 'ACME Corp',
      balanceAfter: 150700.75,
    },
    {
      id: 'txn_3',
      date: yesterday.toISOString(),
      description: 'Netflix Subscription',
      amount: 649.0,
      type: 'debit',
      category: 'Bills',
      to: 'Netflix India',
      balanceAfter: 75700.75,
    },
    {
      id: 'txn_4',
      date: yesterday.toISOString(),
      description: 'IMPS from Mom',
      amount: 2000.0,
      type: 'credit',
      category: 'Other',
      from: 'Jane Doe',
      balanceAfter: 76349.75,
    },
    {
      id: 'txn_5',
      date: twoDaysAgo.toISOString(),
      description: 'Card payment at Myntra',
      amount: 3200.0,
      type: 'debit',
      category: 'Shopping',
      to: 'Myntra',
      balanceAfter: 74349.75,
    },
    {
      id: 'txn_6',
      date: twoDaysAgo.toISOString(),
      description: 'Flight ticket to GOA',
      amount: 5500.0,
      type: 'debit',
      category: 'Travel',
      to: 'Indigo',
      balanceAfter: 77549.75,
    },
  ],
  payees: [
    {
      id: 'payee_1',
      name: 'Rohi R',
      upiId: 'rohi@okicici',
      avatar: '',
    },
    {
      id: 'payee_2',
      name: 'Pera L',
      upiId: 'pera@ybl',
      avatar: '',
    },
    {
      id: 'payee_3',
      name: 'HARSH SHIV',
      upiId: 'harsh.shiv@idfc',
      accountNumber: '10084569848',
      ifsc: 'IDFB0080169',
      avatar: '',
      bankName: 'IDFC BANK LIMITED',
      nickname: 'HARS',
    },
    {
      id: 'payee_4',
      name: 'Hars S',
      upiId: 'hars@paytm',
      avatar: '',
    },
    {
        id: 'payee_5',
        name: 'Sush P',
        upiId: 'sush@axis',
        avatar: '',
    }
  ],
  chatMessages: [
    {
      id: 'msg_1',
      sender: 'system',
      content: 'You are connected to Agent Priya.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg_2',
      sender: 'user',
      content: 'Hi, I have an issue with a recent transaction.',
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: 'msg_3',
      sender: 'agent',
      content: 'Hello! I can help with that. Please provide the transaction ID or details.',
      timestamp: new Date(Date.now() - 45000).toISOString(),
    },
  ],
  appSettings: defaultAppSettings,
};
