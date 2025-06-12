import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Middleware para tratamento de erros
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Log do erro
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Erro operacional conhecido
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }
  
  // Erro de validação do Prisma
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Dados inválidos fornecidos'
    });
    return;
  }
  
  // Erro de restrição única do Prisma
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2002') {
    res.status(409).json({
      status: 'error',
      message: 'Já existe um registro com este valor único'
    });
    return;
  }
  
  // Erro de registro não encontrado no Prisma
  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2025') {
    res.status(404).json({
      status: 'error',
      message: 'Registro não encontrado'
    });
    return;
  }
  
  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido. Por favor, faça login novamente'
    });
    return;
  }
  
  // Erro de expiração de JWT
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Seu token expirou. Por favor, faça login novamente'
    });
    return;
  }
  
  // Erro de desenvolvimento vs. produção
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // Erro desconhecido em produção
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado!'
    });
  }
};

export default errorHandler;
