import api from './api';

// Interface para os dados do dashboard
interface DashboardData {
  totalBalance: number;
  balanceTrend: number;
  monthlyIncome: number;
  incomeTrend: number;
  monthlyExpenses: number;
  expensesTrend: number;
  expensesByCategory: CategoryExpense[];
  recentTransactions: Transaction[];
  goals: Goal[];
}

// Interface para despesas por categoria
interface CategoryExpense {
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

// Interface para transação
interface Transaction {
  id: number;
  description: string;
  amount: number;
  transactionDate: string;
  transactionType: 'income' | 'expense' | 'transfer';
  category: {
    name: string;
    icon: string;
    color: string;
  };
  wallet: {
    name: string;
    icon: string;
  };
}

// Interface para meta
interface Goal {
  id: number;
  title: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  isCompleted: boolean;
}

/**
 * Serviço para gerenciar dados do dashboard
 */
export const dashboardService = {
  /**
   * Obter dados do dashboard
   */
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await api.get('/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  },

  /**
   * Obter resumo mensal
   */
  getMonthlySummary: async (year: number, month: number): Promise<any> => {
    try {
      const response = await api.get('/transactions/summary/monthly', {
        params: { year, month }
      });
      return response.data.summary;
    } catch (error) {
      console.error('Erro ao buscar resumo mensal:', error);
      throw error;
    }
  },

  /**
   * Obter resumo por categoria
   */
  getCategorySummary: async (
    type: 'income' | 'expense' = 'expense',
    startDate?: Date,
    endDate?: Date
  ): Promise<any> => {
    try {
      const params: any = { type };
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        params.endDate = endDate.toISOString();
      }
      
      const response = await api.get('/transactions/summary/category', { params });
      return response.data.summary;
    } catch (error) {
      console.error('Erro ao buscar resumo por categoria:', error);
      throw error;
    }
  }
};

export default dashboardService;
