import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Controlador para gerenciar carteiras financeiras
 */
export class WalletController {
  /**
   * Obter todas as carteiras do usuário
   */
  public static async getAllWallets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar carteiras do usuário
      const wallets = await prisma.wallet.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      });
      
      // Calcular saldo total
      const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      
      // Responder com as carteiras
      res.status(200).json({
        status: 'success',
        count: wallets.length,
        totalBalance,
        wallets
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter uma carteira pelo ID
   */
  public static async getWalletById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const walletId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar carteira
      const wallet = await prisma.wallet.findFirst({
        where: { 
          id: walletId,
          userId 
        }
      });
      
      if (!wallet) {
        throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
      }
      
      // Responder com a carteira
      res.status(200).json({
        status: 'success',
        wallet
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Criar uma nova carteira
   */
  public static async createWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      const { name, icon, balance, type, isDefault } = req.body;
      
      // Validar tipo de carteira
      if (!['cash', 'bank', 'credit', 'investment'].includes(type)) {
        throw new AppError('Tipo de carteira inválido', 400);
      }
      
      // Se for definida como padrão, remover padrão das outras
      if (isDefault) {
        await prisma.wallet.updateMany({
          where: { 
            userId,
            isDefault: true
          },
          data: { isDefault: false }
        });
      }
      
      // Criar carteira
      const wallet = await prisma.wallet.create({
        data: {
          userId,
          name,
          icon,
          balance: Number(balance || 0),
          type,
          isDefault: Boolean(isDefault)
        }
      });
      
      // Responder com a carteira criada
      res.status(201).json({
        status: 'success',
        wallet
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Atualizar uma carteira existente
   */
  public static async updateWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const walletId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se a carteira existe
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId
        }
      });
      
      if (!existingWallet) {
        throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
      }
      
      const { name, icon, type, isDefault } = req.body;
      
      // Validar tipo de carteira
      if (type && !['cash', 'bank', 'credit', 'investment'].includes(type)) {
        throw new AppError('Tipo de carteira inválido', 400);
      }
      
      // Se for definida como padrão, remover padrão das outras
      if (isDefault) {
        await prisma.wallet.updateMany({
          where: { 
            userId,
            isDefault: true,
            id: { not: walletId }
          },
          data: { isDefault: false }
        });
      }
      
      // Atualizar carteira
      const wallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          name,
          icon,
          type,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined
        }
      });
      
      // Responder com a carteira atualizada
      res.status(200).json({
        status: 'success',
        wallet
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Ajustar saldo da carteira
   */
  public static async adjustBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const walletId = Number(req.params.id);
      const { balance } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      if (balance === undefined) {
        throw new AppError('O saldo é obrigatório', 400);
      }
      
      // Verificar se a carteira existe
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId
        }
      });
      
      if (!existingWallet) {
        throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
      }
      
      // Atualizar saldo da carteira
      const wallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: Number(balance)
        }
      });
      
      // Responder com a carteira atualizada
      res.status(200).json({
        status: 'success',
        wallet,
        message: 'Saldo ajustado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Excluir uma carteira
   */
  public static async deleteWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const walletId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se a carteira existe
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId
        }
      });
      
      if (!existingWallet) {
        throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
      }
      
      // Verificar se há transações associadas
      const transactionCount = await prisma.transaction.count({
        where: { walletId }
      });
      
      if (transactionCount > 0) {
        throw new AppError('Não é possível excluir uma carteira com transações associadas', 400);
      }
      
      // Verificar se é a única carteira do usuário
      const walletCount = await prisma.wallet.count({
        where: { userId }
      });
      
      if (walletCount === 1) {
        throw new AppError('Não é possível excluir a única carteira do usuário', 400);
      }
      
      // Excluir carteira
      await prisma.wallet.delete({
        where: { id: walletId }
      });
      
      // Se a carteira excluída era padrão, definir outra como padrão
      if (existingWallet.isDefault) {
        const anotherWallet = await prisma.wallet.findFirst({
          where: { userId }
        });
        
        if (anotherWallet) {
          await prisma.wallet.update({
            where: { id: anotherWallet.id },
            data: { isDefault: true }
          });
        }
      }
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'Carteira excluída com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WalletController;
