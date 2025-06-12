import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Controlador para gerenciar metas financeiras
 */
export class GoalController {
  /**
   * Obter todas as metas do usuário
   */
  public static async getAllGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar metas do usuário
      const goals = await prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      // Responder com as metas
      res.status(200).json({
        status: 'success',
        count: goals.length,
        goals
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter uma meta pelo ID
   */
  public static async getGoalById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar meta
      const goal = await prisma.goal.findFirst({
        where: { 
          id: goalId,
          userId 
        }
      });
      
      if (!goal) {
        throw new AppError(`Meta com ID ${goalId} não encontrada`, 404);
      }
      
      // Responder com a meta
      res.status(200).json({
        status: 'success',
        goal
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Criar uma nova meta
   */
  public static async createGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      const { title, description, targetAmount, deadline, icon, color } = req.body;
      
      // Criar meta
      const goal = await prisma.goal.create({
        data: {
          userId,
          title,
          description,
          targetAmount: Number(targetAmount),
          deadline: deadline ? new Date(deadline) : null,
          icon,
          color,
          currentAmount: 0,
          isCompleted: false
        }
      });
      
      // Responder com a meta criada
      res.status(201).json({
        status: 'success',
        goal
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Atualizar uma meta existente
   */
  public static async updateGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se a meta existe
      const existingGoal = await prisma.goal.findFirst({
        where: {
          id: goalId,
          userId
        }
      });
      
      if (!existingGoal) {
        throw new AppError(`Meta com ID ${goalId} não encontrada`, 404);
      }
      
      const { title, description, targetAmount, deadline, icon, color } = req.body;
      
      // Atualizar meta
      const goal = await prisma.goal.update({
        where: { id: goalId },
        data: {
          title,
          description,
          targetAmount: targetAmount !== undefined ? Number(targetAmount) : undefined,
          deadline: deadline ? new Date(deadline) : undefined,
          icon,
          color
        }
      });
      
      // Verificar se a meta foi concluída após a atualização
      if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
        await prisma.goal.update({
          where: { id: goalId },
          data: { isCompleted: true }
        });
        
        // Criar conquista para meta concluída
        await prisma.achievement.create({
          data: {
            userId,
            title: 'Meta Alcançada',
            description: `Você alcançou sua meta: ${goal.title}`,
            icon: '🏆',
            points: 50,
            category: 'goals'
          }
        });
      }
      
      // Responder com a meta atualizada
      res.status(200).json({
        status: 'success',
        goal
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Excluir uma meta
   */
  public static async deleteGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Verificar se a meta existe
      const existingGoal = await prisma.goal.findFirst({
        where: {
          id: goalId,
          userId
        }
      });
      
      if (!existingGoal) {
        throw new AppError(`Meta com ID ${goalId} não encontrada`, 404);
      }
      
      // Excluir meta
      await prisma.goal.delete({
        where: { id: goalId }
      });
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'Meta excluída com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Contribuir para uma meta
   */
  public static async contributeToGoal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const goalId = Number(req.params.id);
      const { amount } = req.body;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      if (!amount || amount <= 0) {
        throw new AppError('O valor da contribuição deve ser maior que zero', 400);
      }
      
      // Verificar se a meta existe
      const existingGoal = await prisma.goal.findFirst({
        where: {
          id: goalId,
          userId
        }
      });
      
      if (!existingGoal) {
        throw new AppError(`Meta com ID ${goalId} não encontrada`, 404);
      }
      
      // Atualizar meta em uma transação
      const goal = await prisma.$transaction(async (prismaClient) => {
        // Atualizar valor atual da meta
        const updatedGoal = await prismaClient.goal.update({
          where: { id: goalId },
          data: {
            currentAmount: {
              increment: Number(amount)
            }
          }
        });
        
        // Verificar se a meta foi concluída
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount && !updatedGoal.isCompleted) {
          // Marcar como concluída
          await prismaClient.goal.update({
            where: { id: goalId },
            data: { isCompleted: true }
          });
          
          // Criar conquista para meta concluída
          await prismaClient.achievement.create({
            data: {
              userId,
              title: 'Meta Alcançada',
              description: `Você alcançou sua meta: ${updatedGoal.title}`,
              icon: '🏆',
              points: 50,
              category: 'goals'
            }
          });
        }
        
        return updatedGoal;
      });
      
      // Responder com a meta atualizada
      res.status(200).json({
        status: 'success',
        goal,
        message: 'Contribuição realizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default GoalController;
