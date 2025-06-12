import React from 'react';
import { Box, Typography, LinearProgress, Card, CardContent, Grid, Chip } from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface GoalsListProps {
  goals: Goal[];
}

/**
 * Componente de lista de metas
 * Exibe uma lista de metas financeiras com progresso
 */
const GoalsList: React.FC<GoalsListProps> = ({ goals }) => {
  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Sem prazo';
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy', { locale: ptBR });
  };

  // Calcular progresso
  const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return 100;
    const progress = (current / target) * 100;
    return Math.min(Math.max(0, progress), 100);
  };

  return (
    <Box>
      {goals.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhuma meta encontrada
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            
            return (
              <Grid item xs={12} key={goal.id}>
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: `${goal.color}20`,
                          color: goal.color,
                          mr: 1,
                        }}
                      >
                        {goal.icon}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {goal.title}
                      </Typography>
                      {goal.isCompleted && (
                        <Chip
                          label="Concluída"
                          size="small"
                          color="success"
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(progress)}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        mb: 1,
                        bgcolor: 'background.default',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: goal.color,
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Prazo: {formatDate(goal.deadline)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Faltam: {formatCurrency(goal.targetAmount - goal.currentAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default GoalsList;
