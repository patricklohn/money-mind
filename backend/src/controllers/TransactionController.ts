import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

/**
 * Controlador para gerenciar transações financeiras
 */
export class TransactionController {
  /**
   * Obter todas as transações do usuário com filtros
   */
  public static async getAllTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Extrair parâmetros de consulta
      const {
        startDate,
        endDate,
        type,
        categoryId,
        walletId,
        search,
        page = 1,
        limit = 10
      } = req.query;
      
      // Construir filtros para o Prisma
      const filters: any = {
        userId: userId
      };
      
      if (startDate) {
        filters.transactionDate = {
          ...filters.transactionDate,
          gte: new Date(startDate as string)
        };
      }
      
      if (endDate) {
        filters.transactionDate = {
          ...filters.transactionDate,
          lte: new Date(endDate as string)
        };
      }
      
      if (type) {
        filters.transactionType = type as string;
      }
      
      if (categoryId) {
        filters.categoryId = Number(categoryId);
      }
      
      if (walletId) {
        filters.walletId = Number(walletId);
      }
      
      if (search) {
        filters.description = {
          contains: search as string,
          mode: 'insensitive'
        };
      }
      
      // Calcular paginação
      const skip = (Number(page) - 1) * Number(limit);
      
      // Buscar transações
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: filters,
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
          },
          orderBy: {
            transactionDate: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.transaction.count({
          where: filters
        })
      ]);
      
      // Calcular paginação
      const totalPages = Math.ceil(total / Number(limit));
      
      // Responder com as transações
      res.status(200).json({
        status: 'success',
        count: total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        transactions
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter uma transação pelo ID
   */
  public static async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const transactionId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar transação
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId
        },
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
      });
      
      if (!transaction) {
        throw new AppError(`Transação com ID ${transactionId} não encontrada`, 404);
      }
      
      // Responder com a transação
      res.status(200).json({
        status: 'success',
        transaction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Criar uma nova transação
   */
  public static async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      const { description, amount, transactionDate, transactionType, categoryId, walletId, notes } = req.body;
      
      // Validar tipo de transação
      if (!['income', 'expense', 'transfer'].includes(transactionType)) {
        throw new AppError('Tipo de transação inválido', 400);
      }
      
      // Verificar se a carteira existe
      const wallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId
        }
      });
      
      if (!wallet) {
        throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
      }
      
      // Verificar se a categoria existe
      const category = await prisma.category.findUnique({
        where: {
          id: categoryId
        }
      });
      
      if (!category) {
        throw new AppError(`Categoria com ID ${categoryId} não encontrada`, 404);
      }
      
      // Criar transação em uma transação do banco de dados
      const transaction = await prisma.$transaction(async (prismaClient) => {
        // Criar a transação
        const newTransaction = await prismaClient.transaction.create({
          data: {
            userId,
            description,
            amount: Number(amount),
            transactionDate: new Date(transactionDate),
            transactionType,
            categoryId,
            walletId,
            notes
          },
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
        });
        
        // Atualizar saldo da carteira
        if (transactionType === 'income') {
          await prismaClient.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                increment: Number(amount)
              }
            }
          });
        } else if (transactionType === 'expense') {
          await prismaClient.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                decrement: Number(amount)
              }
            }
          });
        }
        
        return newTransaction;
      });
      
      // Responder com a transação criada
      res.status(201).json({
        status: 'success',
        transaction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Atualizar uma transação existente
   */
  public static async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const transactionId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar transação existente
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId
        }
      });
      
      if (!existingTransaction) {
        throw new AppError(`Transação com ID ${transactionId} não encontrada`, 404);
      }
      
      const { description, amount, transactionDate, transactionType, categoryId, walletId, notes } = req.body;
      
      // Validar tipo de transação
      if (transactionType && !['income', 'expense', 'transfer'].includes(transactionType)) {
        throw new AppError('Tipo de transação inválido', 400);
      }
      
      // Verificar se a carteira existe
      if (walletId) {
        const wallet = await prisma.wallet.findFirst({
          where: {
            id: walletId,
            userId
          }
        });
        
        if (!wallet) {
          throw new AppError(`Carteira com ID ${walletId} não encontrada`, 404);
        }
      }
      
      // Verificar se a categoria existe
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: {
            id: categoryId
          }
        });
        
        if (!category) {
          throw new AppError(`Categoria com ID ${categoryId} não encontrada`, 404);
        }
      }
      
      // Atualizar transação em uma transação do banco de dados
      const transaction = await prisma.$transaction(async (prismaClient) => {
        // Se o valor ou tipo de transação mudou, precisamos atualizar os saldos das carteiras
        if (
          (amount !== undefined && Number(amount) !== existingTransaction.amount) ||
          (transactionType !== undefined && transactionType !== existingTransaction.transactionType) ||
          (walletId !== undefined && walletId !== existingTransaction.walletId)
        ) {
          // Reverter a transação anterior
          if (existingTransaction.transactionType === 'income') {
            await prismaClient.wallet.update({
              where: { id: existingTransaction.walletId },
              data: {
                balance: {
                  decrement: existingTransaction.amount
                }
              }
            });
          } else if (existingTransaction.transactionType === 'expense') {
            await prismaClient.wallet.update({
              where: { id: existingTransaction.walletId },
              data: {
                balance: {
                  increment: existingTransaction.amount
                }
              }
            });
          }
          
          // Aplicar a nova transação
          const newType = transactionType || existingTransaction.transactionType;
          const newAmount = amount !== undefined ? Number(amount) : existingTransaction.amount;
          const newWalletId = walletId || existingTransaction.walletId;
          
          if (newType === 'income') {
            await prismaClient.wallet.update({
              where: { id: newWalletId },
              data: {
                balance: {
                  increment: newAmount
                }
              }
            });
          } else if (newType === 'expense') {
            await prismaClient.wallet.update({
              where: { id: newWalletId },
              data: {
                balance: {
                  decrement: newAmount
                }
              }
            });
          }
        }
        
        // Atualizar a transação
        return prismaClient.transaction.update({
          where: { id: transactionId },
          data: {
            description,
            amount: amount !== undefined ? Number(amount) : undefined,
            transactionDate: transactionDate ? new Date(transactionDate) : undefined,
            transactionType,
            categoryId,
            walletId,
            notes
          },
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
        });
      });
      
      // Responder com a transação atualizada
      res.status(200).json({
        status: 'success',
        transaction
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Excluir uma transação
   */
  public static async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const transactionId = Number(req.params.id);
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Buscar transação existente
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId
        }
      });
      
      if (!existingTransaction) {
        throw new AppError(`Transação com ID ${transactionId} não encontrada`, 404);
      }
      
      // Excluir transação em uma transação do banco de dados
      await prisma.$transaction(async (prismaClient) => {
        // Reverter o efeito da transação no saldo da carteira
        if (existingTransaction.transactionType === 'income') {
          await prismaClient.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                decrement: existingTransaction.amount
              }
            }
          });
        } else if (existingTransaction.transactionType === 'expense') {
          await prismaClient.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                increment: existingTransaction.amount
              }
            }
          });
        }
        
        // Excluir a transação
        await prismaClient.transaction.delete({
          where: { id: transactionId }
        });
      });
      
      // Responder com sucesso
      res.status(200).json({
        status: 'success',
        message: 'Transação excluída com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter resumo mensal de transações
   */
  public static async getMonthlyTransactionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Extrair parâmetros
      const year = Number(req.query.year) || new Date().getFullYear();
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      
      // Calcular datas de início e fim do mês
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      // Buscar transações do mês
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Calcular totais
      const totalIncome = transactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const balance = totalIncome - totalExpenses;
      
      // Buscar mês anterior para comparação
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;
      
      const previousStartDate = new Date(previousYear, previousMonth - 1, 1);
      const previousEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);
      
      const previousTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        }
      });
      
      // Calcular totais do mês anterior
      const previousTotalIncome = previousTransactions
        .filter(t => t.transactionType === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const previousTotalExpenses = previousTransactions
        .filter(t => t.transactionType === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular tendências
      const incomeTrend = previousTotalIncome === 0 
        ? 100 
        : ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100;
      
      const expensesTrend = previousTotalExpenses === 0 
        ? 100 
        : ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100;
      
      // Responder com o resumo
      res.status(200).json({
        status: 'success',
        summary: {
          year,
          month,
          totalIncome,
          totalExpenses,
          balance,
          incomeTrend,
          expensesTrend,
          transactionCount: transactions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obter resumo por categoria
   */
  public static async getCategorySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new AppError('Usuário não autenticado', 401);
      }
      
      // Extrair parâmetros
      const {
        startDate,
        endDate,
        type = 'expense'
      } = req.query;
      
      // Construir filtros
      const filters: any = {
        userId,
        transactionType: type
      };
      
      if (startDate) {
        filters.transactionDate = {
          ...filters.transactionDate,
          gte: new Date(startDate as string)
        };
      }
      
      if (endDate) {
        filters.transactionDate = {
          ...filters.transactionDate,
          lte: new Date(endDate as string)
        };
      }
      
      // Buscar transações
      const transactions = await prisma.transaction.findMany({
        where: filters,
        include: {
          category: true
        }
      });
      
      // Calcular total
      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Agrupar por categoria
      const categorySummary = transactions.reduce((acc: any[], transaction) => {
        const existingCategory = acc.find(c => c.categoryId === transaction.categoryId);
        
        if (existingCategory) {
          existingCategory.amount += transaction.amount;
          existingCategory.count += 1;
        } else {
          acc.push({
            categoryId: transaction.categoryId,
            name: transaction.category.name,
            icon: transaction.category.icon,
            color: transaction.category.color,
            amount: transaction.amount,
            count: 1
          });
        }
        
        return acc;
      }, []);
      
      // Calcular percentagens
      categorySummary.forEach(category => {
        category.percentage = total > 0 ? (category.amount / total) * 100 : 0;
      });
      
      // Ordenar por valor
      categorySummary.sort((a, b) => b.amount - a.amount);
      
      // Responder com o resumo
      res.status(200).json({
        status: 'success',
        summary: {
          total,
          categories: categorySummary
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionController;
