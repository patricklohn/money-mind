import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import prisma from '../lib/prisma';

// Interface para estender o objeto Request do Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email?: string;
        isAdmin?: boolean;
      };
      session?: Record<string, any>;
    }
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1) Verificar se o token existe
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      throw new AppError('Você não está autenticado. Por favor, faça login para obter acesso.', 401);
    }
    
    // 2) Verificar se o token é válido
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    } catch (error) {
      throw new AppError('Token inválido ou expirado', 401);
    }
    
    // 3) Verificar se o usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        mfaEnabled: true
      }
    });
    
    if (!user) {
      throw new AppError('O usuário associado a este token não existe mais', 401);
    }
    
    // 4) Verificar se o token MFA é necessário
    if (decoded.mfaRequired && user.mfaEnabled) {
      throw new AppError('Autenticação MFA necessária', 401);
    }
    
    // 5) Conceder acesso à rota protegida
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };
    
    // Inicializar objeto de sessão se não existir
    req.session = req.session || {};
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para restringir acesso apenas a administradores
 */
export const restrictTo = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || !req.user.isAdmin) {
      throw new AppError('Você não tem permissão para realizar esta ação', 403);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
