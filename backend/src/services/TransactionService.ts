import prisma from '../lib/prisma';
import { AppError, createEntityNotFoundError } from '../utils/appError';

/**
 * Serviço para gerenciar transações financeiras
 */
export class TransactionService {
  /**
   * Buscar todas as transações de um usuário com filtros
   */
  public static async getAllTransactions(
    userId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: 'income' | 'expense' | 'transfer';
      categoryId?: number;
      walletId?: number;
      minAmount?: number;
      maxAmount?: number;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      const where: any = {
        userId: userId
      };

      // Filtro por data
      if (filters.startDate || filters.endDate) {
        where.transactionDate = {};
        if (filters.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      // Filtro por tipo
      if (filters.type) {
        where.transactionType = filters.type;
      }

      // Filtro por categoria
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      // Filtro por carteira
      if (filters.walletId) {
        where.walletId = filters.walletId;
      }

      // Filtro por valor
      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          category: true,
          wallet: true
        },
        orderBy: {
          transactionDate: 'desc'
        },
        take: filters.limit || 100,
        skip: filters.offset || 0
      });

      const total = await prisma.transaction.count({ where });

      return {
        transactions,
        total,
        hasMore: (filters.offset || 0) + transactions.length < total
      };
    } catch (error) {
      throw new AppError('Erro ao buscar transações', 500);
    }
  }

  /**
   * Buscar transação por ID
   */
  public static async getTransactionById(id: number, userId: number) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId
        },
        include: {
          category: true,
          wallet: true
        }
      });

      if (!transaction) {
        throw createEntityNotFoundError('Transação');
      }

      return transaction;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao buscar transação', 500);
    }
  }

  /**
   * Criar nova transação
   */
  public static async createTransaction(
    userId: number,
    data: {
      description: string;
      amount: number;
      transactionDate: Date;
      transactionType: 'income' | 'expense' | 'transfer';
      categoryId: number;
      walletId: number;
      notes?: string;
    }
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verificar se a categoria existe
        const category = await tx.category.findUnique({
          where: { id: data.categoryId }
        });

        if (!category) {
          throw createEntityNotFoundError('Categoria');
        }

        // Verificar se a carteira existe e pertence ao usuário
        const wallet = await tx.wallet.findFirst({
          where: {
            id: data.walletId,
            userId
          }
        });

        if (!wallet) {
          throw createEntityNotFoundError('Carteira');
        }

        // Criar a transação
        const transaction = await tx.transaction.create({
          data: {
            ...data,
            userId
          },
          include: {
            category: true,
            wallet: true
          }
        });

        // Atualizar saldo da carteira
        await tx.wallet.update({
          where: { id: data.walletId },
          data: {
            balance: {
              increment: data.amount
            }
          }
        });

        return transaction;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao criar transação', 500);
    }
  }

  /**
   * Atualizar transação
   */
  public static async updateTransaction(
    id: number,
    userId: number,
    data: {
      description?: string;
      amount?: number;
      transactionDate?: Date;
      transactionType?: 'income' | 'expense' | 'transfer';
      categoryId?: number;
      walletId?: number;
      notes?: string;
    }
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verificar se a transação existe e pertence ao usuário
        const existingTransaction = await tx.transaction.findFirst({
          where: {
            id,
            userId
          }
        });

        if (!existingTransaction) {
          throw createEntityNotFoundError('Transação');
        }

        // Se mudou a carteira, atualizar saldos
        if (data.walletId && data.walletId !== existingTransaction.walletId) {
          const newWallet = await tx.wallet.findFirst({
            where: {
              id: data.walletId,
              userId
            }
          });

          if (!newWallet) {
            throw createEntityNotFoundError('Nova carteira');
          }

          // Reverter o valor da carteira antiga
          await tx.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                decrement: existingTransaction.amount
              }
            }
          });

          // Aplicar o novo valor na nova carteira
          await tx.wallet.update({
            where: { id: data.walletId },
            data: {
              balance: {
                increment: data.amount || existingTransaction.amount
              }
            }
          });
        } else if (data.amount && data.amount !== existingTransaction.amount) {
          // Se mudou apenas o valor, ajustar a diferença
          const difference = data.amount - existingTransaction.amount;
          await tx.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                increment: difference
              }
            }
          });
        }

        // Verificar categoria se foi alterada
        if (data.categoryId) {
          const category = await tx.category.findUnique({
            where: { id: data.categoryId }
          });

          if (!category) {
            throw createEntityNotFoundError('Categoria');
          }
        }

        // Atualizar a transação
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data,
          include: {
            category: true,
            wallet: true
          }
        });

        return updatedTransaction;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao atualizar transação', 500);
    }
  }

  /**
   * Deletar transação
   */
  public static async deleteTransaction(id: number, userId: number) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Verificar se a transação existe e pertence ao usuário
        const existingTransaction = await tx.transaction.findFirst({
          where: {
            id,
            userId
          }
        });

        if (!existingTransaction) {
          throw createEntityNotFoundError('Transação');
        }

        // Reverter o valor da carteira
        await tx.wallet.update({
          where: { id: existingTransaction.walletId },
          data: {
            balance: {
              decrement: existingTransaction.amount
            }
          }
        });

        // Deletar a transação
        await tx.transaction.delete({
          where: { id }
        });

        return { message: 'Transação deletada com sucesso' };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Erro ao deletar transação', 500);
    }
  }

  /**
   * Obter resumo mensal de transações
   */
  public static async getMonthlySummary(
    userId: number,
    year?: number,
    month?: number
  ) {
    try {
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || currentDate.getMonth() + 1;

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          transactionDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const summary = {
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: transactions.length,
        balance: 0
      };

      transactions.forEach((transaction) => {
        if (transaction.amount > 0) {
          summary.totalIncome += transaction.amount;
        } else {
          summary.totalExpense += Math.abs(transaction.amount);
        }
      });

      summary.balance = summary.totalIncome - summary.totalExpense;

      return summary;
    } catch (error) {
      throw new AppError('Erro ao obter resumo mensal', 500);
    }
  }

  /**
   * Obter resumo por categoria
   */
  public static async getCategorySummary(
    userId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      type?: 'income' | 'expense';
    } = {}
  ) {
    try {
      const where: any = {
        userId
      };

      if (filters.startDate || filters.endDate) {
        where.transactionDate = {};
        if (filters.startDate) {
          where.transactionDate.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.transactionDate.lte = filters.endDate;
        }
      }

      if (filters.type) {
        where.transactionType = filters.type;
      }

      const categorySummary = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      // Buscar informações das categorias
      const categoryIds = categorySummary.map(item => item.categoryId);
      const categories = await prisma.category.findMany({
        where: {
          id: {
            in: categoryIds
          }
        }
      });

      const total = categorySummary.reduce((sum, item) => {
        return sum + Math.abs(item._sum.amount || 0);
      }, 0);

      return {
        categories: categorySummary.map(item => {
          const category = categories.find(cat => cat.id === item.categoryId);
          return {
            categoryId: item.categoryId,
            categoryName: category?.name || 'Categoria não encontrada',
            categoryIcon: category?.icon || '❓',
            categoryColor: category?.color || '#gray',
            totalAmount: Math.abs(item._sum.amount || 0),
            transactionCount: item._count.id,
            percentage: total > 0 ? (Math.abs(item._sum.amount || 0) / total) * 100 : 0
          };
        }),
        total
      };
    } catch (error) {
      throw new AppError('Erro ao obter resumo por categoria', 500);
    }
  }
}

