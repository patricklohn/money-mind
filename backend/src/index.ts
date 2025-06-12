import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';
import logger from './utils/logger';
import prisma from './lib/prisma';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const port = process.env.PORT || 3000;

// Middlewares de segurança e otimização
app.use(helmet()); // Segurança de cabeçalhos HTTP
app.use(cors()); // Habilitar CORS
app.use(compression()); // Compressão de respostas
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting para prevenir ataques de força bruta
const limiter = rateLimit({
  max: 100, // 100 requisições
  windowMs: 15 * 60 * 1000, // por 15 minutos
  message: 'Muitas requisições deste IP, por favor tente novamente após 15 minutos'
});
app.use('/api/auth', limiter);

// Rotas
app.use('/api', routes);

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API está funcionando corretamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Middleware para rotas não encontradas
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Não foi possível encontrar ${req.originalUrl} neste servidor!`
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(port, () => {
  logger.info(`Servidor rodando na porta ${port} em modo ${process.env.NODE_ENV}`);
});

// Tratamento de exceções não capturadas
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Encerrando...');
  logger.error(err.name, err.message);
  
  // Fechar servidor e sair do processo
  server.close(() => {
    process.exit(1);
  });
});

// Tratamento de sinais de término
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEBIDO. Encerrando graciosamente');
  
  // Fechar conexão com o banco de dados
  prisma.$disconnect();
  
  // Fechar servidor
  server.close(() => {
    logger.info('Processo encerrado!');
  });
});

export default app;
