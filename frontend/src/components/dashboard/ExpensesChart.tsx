import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Interface para despesa por categoria
interface CategoryExpense {
  categoryId: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

interface ExpensesChartProps {
  data: CategoryExpense[];
}

/**
 * Componente de gráfico de despesas por categoria
 * Exibe um gráfico de rosca com as despesas por categoria
 */
const ExpensesChart: React.FC<ExpensesChartProps> = ({ data }) => {
  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Preparar dados para o gráfico
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  // Opções do gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = data.find(item => item.name === label)?.percentage || 0;
            return `${label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  // Calcular total
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box sx={{ position: 'relative', height: 300, width: '100%' }}>
      {data.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum dado disponível
          </Typography>
        </Box>
      ) : (
        <>
          <Doughnut data={chartData} options={chartOptions} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              width: '100%',
              maxWidth: '120px',
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(total)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total de despesas
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default ExpensesChart;
