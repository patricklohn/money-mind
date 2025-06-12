import { PrismaClient } from '@prisma/client';

// Instância do Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Exportar uma única instância do Prisma Client para ser usada em toda a aplicação
export default prisma;
