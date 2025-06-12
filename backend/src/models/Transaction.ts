import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserInstance } from './User';
import { CategoryInstance } from './Category';
import { WalletInstance } from './Wallet';

// Interface para definir os atributos da transação
export interface TransactionAttributes {
  id: number;
  userId: number;
  categoryId: number;
  walletId: number;
  amount: number;
  description: string;
  transactionDate: Date;
  transactionType: 'income' | 'expense' | 'transfer';
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para definir os atributos opcionais durante a criação
export interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'isRecurring' | 'notes' | 'recurringFrequency'> {}

// Classe do modelo de transação
export class TransactionInstance extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public userId!: number;
  public categoryId!: number;
  public walletId!: number;
  public amount!: number;
  public description!: string;
  public transactionDate!: Date;
  public transactionType!: 'income' | 'expense' | 'transfer';
  public notes?: string;
  public isRecurring!: boolean;
  public recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly user?: UserInstance;
  public readonly category?: CategoryInstance;
  public readonly wallet?: WalletInstance;
}

// Inicialização do modelo
TransactionInstance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    walletId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'wallets',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('income', 'expense', 'transfer'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurringFrequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['transactionDate'],
      },
      {
        fields: ['transactionType'],
      },
    ],
  }
);

export default TransactionInstance;
