import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface BalanceCardProps {
  title: string;
  amount: number;
  trend: number;
  color: string;
  trendInverted?: boolean;
}

/**
 * Componente de card de saldo
 * Exibe um valor monetário com tendência de crescimento/queda
 */
const BalanceCard: React.FC<BalanceCardProps> = ({ 
  title, 
  amount, 
  trend, 
  color,
  trendInverted = false
}) => {
  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Determinar se a tendência é positiva ou negativa
  const isPositiveTrend = trendInverted ? trend < 0 : trend > 0;
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        
        <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
          {formatCurrency(amount)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            icon={isPositiveTrend ? <TrendingUp /> : <TrendingDown />}
            label={`${Math.abs(trend).toFixed(1)}%`}
            size="small"
            color={isPositiveTrend ? "success" : "error"}
            sx={{ mr: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            em relação ao mês anterior
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
