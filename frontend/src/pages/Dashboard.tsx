import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';

// Componentes
import BalanceCard from '../components/dashboard/BalanceCard';
import TransactionList from '../components/dashboard/TransactionList';
import ExpensesChart from '../components/dashboard/ExpensesChart';
import GoalsList from '../components/dashboard/GoalsList';

const Dashboard: React.FC = () => {
  // Buscar dados do dashboard
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getData(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Erro ao carregar dados do dashboard. Por favor, tente novamente.
        </Typography>
      </Box>
    );
  }

  const dashboard = data?.dashboard;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      {/* Saldo e carteiras */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <BalanceCard 
            title="Saldo Total"
            amount={dashboard?.totalBalance || 0} 
            trend={dashboard?.balanceTrend || 0}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resumo do Mês
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Receitas
              </Typography>
              <Typography variant="h6" color="success.main">
                R$ {dashboard?.currentMonth?.income.toFixed(2)}
                {dashboard?.trends?.income > 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                    +{dashboard.trends.income.toFixed(1)}%
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Despesas
              </Typography>
              <Typography variant="h6" color="error.main">
                R$ {dashboard?.currentMonth?.expenses.toFixed(2)}
                {dashboard?.trends?.expenses > 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                    +{dashboard.trends.expenses.toFixed(1)}%
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Saldo
              </Typography>
              <Typography 
                variant="h6" 
                color={dashboard?.currentMonth?.balance >= 0 ? 'success.main' : 'error.main'}
              >
                R$ {dashboard?.currentMonth?.balance.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos e transações recentes */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Despesas por Categoria
            </Typography>
            <ExpensesChart data={dashboard?.expensesByCategory || []} />
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Transações Recentes
            </Typography>
            <TransactionList transactions={dashboard?.recentTransactions || []} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Metas Ativas
            </Typography>
            <GoalsList goals={dashboard?.goals?.data || []} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
