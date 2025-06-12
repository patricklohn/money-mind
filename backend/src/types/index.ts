// Tipos TypeScript para as entidades do Prisma

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  isAdmin: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  userId: number;
  description: string;
  amount: number;
  transactionDate: Date;
  transactionType: 'income' | 'expense' | 'transfer';
  categoryId: number;
  walletId: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  category?: Category;
  wallet?: Wallet;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: number;
  userId: number;
  name: string;
  icon: string;
  balance: number;
  type: 'cash' | 'bank' | 'credit' | 'investment';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  icon: string;
  color: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Achievement {
  id: number;
  userId: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  achievedAt: Date;
  category: 'savings' | 'investment' | 'budget' | 'goals' | 'streak';
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

// DTOs para criação e atualização
export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
  isAdmin?: boolean;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  password?: string;
  isAdmin?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  profileImage?: string;
}

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  transactionDate: Date;
  transactionType: 'income' | 'expense' | 'transfer';
  categoryId: number;
  walletId: number;
  notes?: string;
}

export interface UpdateTransactionDTO {
  description?: string;
  amount?: number;
  transactionDate?: Date;
  transactionType?: 'income' | 'expense' | 'transfer';
  categoryId?: number;
  walletId?: number;
  notes?: string;
}

export interface CreateWalletDTO {
  name: string;
  icon: string;
  balance: number;
  type: 'cash' | 'bank' | 'credit' | 'investment';
  isDefault?: boolean;
}

export interface UpdateWalletDTO {
  name?: string;
  icon?: string;
  balance?: number;
  type?: 'cash' | 'bank' | 'credit' | 'investment';
  isDefault?: boolean;
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  targetAmount: number;
  deadline?: Date;
  icon: string;
  color: string;
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: Date;
  icon?: string;
  color?: string;
  isCompleted?: boolean;
}

