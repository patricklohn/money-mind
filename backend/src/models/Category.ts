import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserInstance } from './User';

// Interface para definir os atributos da categoria
export interface CategoryAttributes {
  id: number;
  name: string;
  icon: string;
  color: string;
  userId?: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para definir os atributos opcionais durante a criação
export interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'isDefault'> {}

// Classe do modelo de categoria
export class CategoryInstance extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public icon!: string;
  public color!: string;
  public userId?: number;
  public isDefault!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly user?: UserInstance;
}

// Inicialização do modelo
CategoryInstance.init(
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
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#6366f1',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    indexes: [
      {
        fields: ['userId'],
      },
    ],
  }
);

export default CategoryInstance;
