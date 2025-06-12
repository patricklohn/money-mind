import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserInstance } from './User';

// Interface para definir os atributos da carteira
export interface WalletAttributes {
  id: number;
  name: string;
  balance: number;
  walletType: 'bank_account' | 'credit_card' | 'cash' | 'investment' | 'digital_wallet';
  icon: string;
  color: string;
  userId: number;
  bankName?: string;
  accountNumber?: string;
  agency?: string;
  creditLimit?: number;
  dueDate?: number;
  closingDate?: number;
  provider?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para definir os atributos opcionais durante a criação
export interface WalletCreationAttributes extends Optional<WalletAttributes, 'id' | 'bankName' | 'accountNumber' | 'agency' | 'creditLimit' | 'dueDate' | 'closingDate' | 'provider'> {}

// Classe do modelo de carteira
export class WalletInstance extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  public id!: number;
  public name!: string;
  public balance!: number;
  public walletType!: 'bank_account' | 'credit_card' | 'cash' | 'investment' | 'digital_wallet';
  public icon!: string;
  public color!: string;
  public userId!: number;
  public bankName?: string;
  public accountNumber?: string;
  public agency?: string;
  public creditLimit?: number;
  public dueDate?: number;
  public closingDate?: number;
  public provider?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly user?: UserInstance;
}

// Inicialização do modelo
WalletInstance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    walletType: {
      type: DataTypes.ENUM('bank_account', 'credit_card', 'cash', 'investment', 'digital_wallet'),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '💰',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#3b82f6',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    agency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 31,
      },
    },
    closingDate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 31,
      },
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'wallets',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['walletType'],
      },
    ],
  }
);

export default WalletInstance;
