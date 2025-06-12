import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do banco de dados
const DB_NAME = process.env.DB_NAME || 'moneymind';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);

// Criar instância do Sequelize
export const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : undefined
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Função para testar a conexão com o banco de dados
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    logger.error('Não foi possível conectar ao banco de dados:', error);
    throw error;
  }
};

export default sequelize;
