import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserInstance } from './User';

// Interface para definir os atributos da conquista
export interface AchievementAttributes {
  id: number;
  userId: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  achievedAt: Date;
  category: 'savings' | 'investment' | 'budget' | 'goals' | 'streak';
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para definir os atributos opcionais durante a criação
export interface AchievementCreationAttributes extends Optional<AchievementAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Classe do modelo de conquista
export class AchievementInstance extends Model<AchievementAttributes, AchievementCreationAttributes> implements AchievementAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public description!: string;
  public icon!: string;
  public points!: number;
  public achievedAt!: Date;
  public category!: 'savings' | 'investment' | 'budget' | 'goals' | 'streak';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly user?: UserInstance;
}

// Inicialização do modelo
AchievementInstance.init(
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    achievedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    category: {
      type: DataTypes.ENUM('savings', 'investment', 'budget', 'goals', 'streak'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'achievements',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['category'],
      },
    ],
  }
);

export default AchievementInstance;
