import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserInstance } from './User';

// Interface para definir os atributos da meta
export interface GoalAttributes {
  id: number;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: Date;
  icon: string;
  color: string;
  userId: number;
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para definir os atributos opcionais durante a criação
export interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'currentAmount' | 'isCompleted' | 'deadline'> {}

// Classe do modelo de meta
export class GoalInstance extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public currentAmount!: number;
  public targetAmount!: number;
  public deadline?: Date;
  public icon!: string;
  public color!: string;
  public userId!: number;
  public isCompleted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly user?: UserInstance;
  
  // Método para calcular o progresso da meta
  public getProgress(): number {
    if (this.targetAmount <= 0) return 100;
    const progress = (this.currentAmount / this.targetAmount) * 100;
    return Math.min(Math.max(0, progress), 100);
  }
  
  // Método para contribuir para a meta
  public async contribute(amount: number): Promise<void> {
    if (amount <= 0) throw new Error('O valor da contribuição deve ser maior que zero');
    
    this.currentAmount += amount;
    
    if (this.currentAmount >= this.targetAmount) {
      this.isCompleted = true;
    }
    
    await this.save();
  }
}

// Inicialização do modelo
GoalInstance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    currentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    targetAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '🎯',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#10b981',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'goals',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['isCompleted'],
      },
    ],
  }
);

export default GoalInstance;
