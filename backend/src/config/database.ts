import prisma from '../lib/prisma';
import logger from '../utils/logger';

// Função para testar a conexão com o banco de dados
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    logger.error('Não foi possível conectar ao banco de dados:', error);
    throw error;
  }
};

// Função para desconectar do banco de dados
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Desconectado do banco de dados.');
  } catch (error) {
    logger.error('Erro ao desconectar do banco de dados:', error);
    throw error;
  }
};

export default prisma;

