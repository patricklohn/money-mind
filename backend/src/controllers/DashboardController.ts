import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Controlador para gerenciar o dashboard do usuário
 */
export class DashboardController {
  /**
   * Obter dados do dashboard
   */
  public static async getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Obter data atual
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calcular datas de início e fim do mês atual
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
      
      // Calcular datas de início e fim do mês anterior
      const startOfPrevMonth = new Date(currentYear, currentMonth - 2, 1);
      const endOfPrevMonth = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59, 999);
      
      // Buscar dados em paralelo
      const [
        wallets,
        currentMonthTransactions,
        previousMonthTransactions,
        goals,
        recentTransactions
      ] = await Promise.all([
        // Carteiras do usuário
        prisma.wallet.findMany({
          where: { userId },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }),
        
        // Transações do mês atual
        prisma.transaction.findMany({
          where: {
            userId,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          include: {
            category: true
          }
        }),
        
        // Transações do mês anterior
        prisma.transaction.findMany({
          where: {
            userId,
            transactionDate: {
              gte: startOfPrevMonth,
              lte: endOfPrevMonth
            }
          }
        }),
        
        // Metas do usuário
        prisma.goal.findMany({
          where: { 
            userId,
            isCompleted: false
          },
          orderBy: [
            { deadline: 'asc' },
            { createdAt: 'desc' }
          ],
          take: 5
        }),
        
        // Transações recentes
        prisma.transaction.findMany({
          where: { userId },
          orderBy: { transactionDate: 'desc' },
          take: 10,
          include: {
            category: {
              select: {
                name: true,
                icon: true,
                color: true
              }
            },
            wallet: {
              select: {
                name: true,
                icon: true
              }
            }
          }
        })
      ]);
      
      // Calcular saldo total
      const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      
      // Calcular totais do mês atual
      const currentMonthIncome = currentMonthTransactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentMonthExpenses = currentMonthTransactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular totais do mês anterior
      const previousMonthIncome = previousMonthTransactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const previousMonthExpenses = previousMonthTransactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular tendências
      const incomeTrend = previousMonthIncome === 0 
        ? 100 
        : ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100;
      
      const expensesTrend = previousMonthExpenses === 0 
        ? 100 
        : ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
      
      // Agrupar despesas por categoria
      const expensesByCategory = currentMonthTransactions
        .filter(t => t.transactionType === 'expense')
        .reduce((acc: any[], transaction) => {
          const existingCategory = acc.find(c => c.categoryId === transaction.categoryId);
          
          if (existingCategory) {
            existingCategory.amount += transaction.amount;
          } else {
            acc.push({
              categoryId: transaction.categoryId,
              name: transaction.category.name,
              icon: transaction.category.icon,
              color: transaction.category.color,
              amount: transaction.amount
            });
          }
          
          return acc;
        }, []);
      
      // Calcular percentagens
      expensesByCategory.forEach(category => {
        category.percentage = currentMonthExpenses > 0 
          ? (category.amount / currentMonthExpenses) * 100 
          : 0;
      });
      
      // Ordenar por valor
      expensesByCategory.sort((a, b) => b.amount - a.amount);
      
      // Responder com os dados do dashboard
      res.status(200).json({
        status: 'success',
        dashboard: {
          totalBalance,
          wallets: {
            count: wallets.length,
            data: wallets
          },
          currentMonth: {
            year: currentYear,
            month: currentMonth,
            income: currentMonthIncome,
            expenses: currentMonthExpenses,
            balance: currentMonthIncome - currentMonthExpenses
          },
          trends: {
            income: incomeTrend,
            expenses: expensesTrend
          },
          expensesByCategory,
          goals: {
            count: goals.length,
            data: goals
          },
          recentTransactions
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
