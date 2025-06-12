import { TransactionInstance, TransactionAttributes } from '../models/Transaction';
import { WalletInstance } from '../models/Wallet';
import { CategoryInstance } from '../models/Category';
import { AppError, createEntityNotFoundError } from '../utils/appError';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';

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
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const {
      startDate,
      endDate,
      type,
      categoryId,
      walletId,
      search,
      page = 1,
      limit = 10
    } = filters;

    // Construir condições de busca
    const where: any = { userId };

    if (startDate) {
      where.transactionDate = {
        ...where.transactionDate,
        [Op.gte]: startDate
      };
    }

    if (endDate) {
      where.transactionDate = {
        ...where.transactionDate,
        [Op.lte]: endDate
      };
    }

    if (type) {
      where.transactionType = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (walletId) {
      where.walletId = walletId;
    }

    if (search) {
      where.description = {
        [Op.iLike]: `%${search}%`
      };
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar transações
    const { count, rows } = await TransactionInstance.findAndCountAll({
      where,
      include: [
        {
          model: CategoryInstance,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: WalletInstance,
          as: 'wallet',
          attributes: ['id', 'name', 'icon', 'walletType']
        }
      ],
      order: [['transactionDate', 'DESC']],
      limit,
      offset
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(count / limit);

    return {
      transactions: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages
      }
    };
  }

  /**
   * Buscar uma transação pelo ID
   */
  public static async getTransactionById(id: number, userId: number) {
    const transaction = await TransactionInstance.findOne({
      where: { id, userId },
      include: [
        {
          model: CategoryInstance,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: WalletInstance,
          as: 'wallet',
          attributes: ['id', 'name', 'icon', 'walletType']
        }
      ]
    });

    if (!transaction) {
      throw createEntityNotFoundError('Transação', id);
    }

    return transaction;
  }

  /**
   * Criar uma nova transação
   */
  public static async createTransaction(
    data: Omit<TransactionAttributes, 'id' | 'createdAt' | 'updatedAt'>,
    userId: number
  ) {
    // Iniciar transação no banco de dados
    const transaction = await sequelize.transaction();

    try {
      // Verificar se a carteira existe e pertence ao usuário
      const wallet = await WalletInstance.findOne({
        where: { id: data.walletId, userId },
        transaction
      });

      if (!wallet) {
        throw createEntityNotFoundError('Carteira', data.walletId);
      }

      // Verificar se a categoria existe
      const category = await CategoryInstance.findOne({
        where: {
          id: data.categoryId,
          [Op.or]: [{ userId }, { userId: null }]
        },
        transaction
      });

      if (!category) {
        throw createEntityNotFoundError('Categoria', data.categoryId);
      }

      // Criar a transação
      const newTransaction = await TransactionInstance.create(
        {
          ...data,
          userId
        },
        { transaction }
      );

      // Atualizar o saldo da carteira
      if (data.transactionType === 'income') {
        wallet.balance += data.amount;
      } else if (data.transactionType === 'expense') {
        wallet.balance -= data.amount;
      }

      await wallet.save({ transaction });

      // Confirmar a transação no banco de dados
      await transaction.commit();

      // Buscar a transação completa com relacionamentos
      return await TransactionInstance.findByPk(newTransaction.id, {
        include: [
          {
            model: CategoryInstance,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          },
          {
            model: WalletInstance,
            as: 'wallet',
            attributes: ['id', 'name', 'icon', 'walletType']
          }
        ]
      });
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Atualizar uma transação existente
   */
  public static async updateTransaction(
    id: number,
    data: Partial<Omit<TransactionAttributes, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
    userId: number
  ) {
    // Iniciar transação no banco de dados
    const transaction = await sequelize.transaction();

    try {
      // Buscar a transação existente
      const existingTransaction = await TransactionInstance.findOne({
        where: { id, userId },
        transaction
      });

      if (!existingTransaction) {
        throw createEntityNotFoundError('Transação', id);
      }

      // Se a carteira foi alterada, verificar se a nova carteira existe
      if (data.walletId && data.walletId !== existingTransaction.walletId) {
        const newWallet = await WalletInstance.findOne({
          where: { id: data.walletId, userId },
          transaction
        });

        if (!newWallet) {
          throw createEntityNotFoundError('Carteira', data.walletId);
        }

        // Reverter o efeito da transação na carteira antiga
        const oldWallet = await WalletInstance.findByPk(existingTransaction.walletId, { transaction });
        if (oldWallet) {
          if (existingTransaction.transactionType === 'income') {
            oldWallet.balance -= existingTransaction.amount;
          } else if (existingTransaction.transactionType === 'expense') {
            oldWallet.balance += existingTransaction.amount;
          }
          await oldWallet.save({ transaction });
        }

        // Aplicar o efeito na nova carteira
        const transactionType = data.transactionType || existingTransaction.transactionType;
        const amount = data.amount || existingTransaction.amount;

        if (transactionType === 'income') {
          newWallet.balance += amount;
        } else if (transactionType === 'expense') {
          newWallet.balance -= amount;
        }

        await newWallet.save({ transaction });
      }
      // Se apenas o valor ou tipo foi alterado, atualizar o saldo da carteira atual
      else if (data.amount !== undefined || data.transactionType !== undefined) {
        const wallet = await WalletInstance.findByPk(existingTransaction.walletId, { transaction });
        
        if (wallet) {
          // Reverter o efeito da transação antiga
          if (existingTransaction.transactionType === 'income') {
            wallet.balance -= existingTransaction.amount;
          } else if (existingTransaction.transactionType === 'expense') {
            wallet.balance += existingTransaction.amount;
          }

          // Aplicar o efeito da transação atualizada
          const transactionType = data.transactionType || existingTransaction.transactionType;
          const amount = data.amount !== undefined ? data.amount : existingTransaction.amount;

          if (transactionType === 'income') {
            wallet.balance += amount;
          } else if (transactionType === 'expense') {
            wallet.balance -= amount;
          }

          await wallet.save({ transaction });
        }
      }

      // Se a categoria foi alterada, verificar se a nova categoria existe
      if (data.categoryId && data.categoryId !== existingTransaction.categoryId) {
        const category = await CategoryInstance.findOne({
          where: {
            id: data.categoryId,
            [Op.or]: [{ userId }, { userId: null }]
          },
          transaction
        });

        if (!category) {
          throw createEntityNotFoundError('Categoria', data.categoryId);
        }
      }

      // Atualizar a transação
      await existingTransaction.update(data, { transaction });

      // Confirmar a transação no banco de dados
      await transaction.commit();

      // Buscar a transação atualizada com relacionamentos
      return await TransactionInstance.findByPk(id, {
        include: [
          {
            model: CategoryInstance,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          },
          {
            model: WalletInstance,
            as: 'wallet',
            attributes: ['id', 'name', 'icon', 'walletType']
          }
        ]
      });
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Excluir uma transação
   */
  public static async deleteTransaction(id: number, userId: number) {
    // Iniciar transação no banco de dados
    const transaction = await sequelize.transaction();

    try {
      // Buscar a transação
      const existingTransaction = await TransactionInstance.findOne({
        where: { id, userId },
        transaction
      });

      if (!existingTransaction) {
        throw createEntityNotFoundError('Transação', id);
      }

      // Atualizar o saldo da carteira
      const wallet = await WalletInstance.findByPk(existingTransaction.walletId, { transaction });
      
      if (wallet) {
        if (existingTransaction.transactionType === 'income') {
          wallet.balance -= existingTransaction.amount;
        } else if (existingTransaction.transactionType === 'expense') {
          wallet.balance += existingTransaction.amount;
        }

        await wallet.save({ transaction });
      }

      // Excluir a transação
      await existingTransaction.destroy({ transaction });

      // Confirmar a transação no banco de dados
      await transaction.commit();

      return { success: true };
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obter resumo mensal de transações
   */
  public static async getMonthlyTransactionSummary(userId: number, year: number, month: number) {
    // Calcular datas de início e fim do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Buscar transações do mês
    const transactions = await TransactionInstance.findAll({
      where: {
        userId,
        transactionDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: CategoryInstance,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }
      ]
    });

    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.transactionType === 'income') {
        totalIncome += parseFloat(transaction.amount.toString());
      } else if (transaction.transactionType === 'expense') {
        totalExpense += parseFloat(transaction.amount.toString());
      }
    });

    // Calcular saldo
    const balance = totalIncome - totalExpense;

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length
    };
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
    }
  ) {
    const { startDate, endDate, type = 'expense' } = filters;

    // Construir condições de busca
    const where: any = {
      userId,
      transactionType: type
    };

    if (startDate) {
      where.transactionDate = {
        ...where.transactionDate,
        [Op.gte]: startDate
      };
    }

    if (endDate) {
      where.transactionDate = {
        ...where.transactionDate,
        [Op.lte]: endDate
      };
    }

    // Buscar transações agrupadas por categoria
    const categorySummary = await TransactionInstance.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where,
      include: [
        {
          model: CategoryInstance,
          as: 'category',
          attributes: ['name', 'icon', 'color']
        }
      ],
      group: ['categoryId', 'category.id', 'category.name', 'category.icon', 'category.color'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    // Calcular total geral
    const total = categorySummary.reduce((sum, item) => {
      return sum + parseFloat((item.getDataValue('total') as any).toString());
    }, 0);

    // Formatar resultado com percentuais
    return {
      type,
      total,
      categories: categorySummary.map(item => {
        const categoryTotal = parseFloat((item.getDataValue('total') as any).toString());
        const percentage = (categoryTotal / total) * 100;
        
        return {
          categoryId: item.categoryId,
          name: item.category?.name,
          icon: item.category?.icon,
          color: item.category?.color,
          total: categoryTotal,
          percentage
        };
      })
    };
  }
}

export default TransactionService;
