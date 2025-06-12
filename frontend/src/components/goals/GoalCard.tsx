import React from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Grid, LinearProgress } from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalCardProps {
  goal: {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    description?: string;
    isCompleted: boolean;
    category?: {
      name: string;
      color: string;
    };
  };
  onEdit: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  // Calcular progresso
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  
  // Formatar data
  const formattedDeadline = format(new Date(goal.deadline), 'dd MMM yyyy', { locale: ptBR });
  
  // Verificar se está próximo do prazo (menos de 7 dias)
  const isNearDeadline = () => {
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderTop: '4px solid',
        borderColor: goal.isCompleted ? 'success.main' : (isNearDeadline() ? 'warning.main' : 'primary.main')
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {goal.name}
        </Typography>
        
        {goal.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {goal.description}
          </Typography>
        )}
        
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Meta
            </Typography>
            <Typography variant="body1">
              R$ {goal.targetAmount.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Atual
            </Typography>
            <Typography variant="body1">
              R$ {goal.currentAmount.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mb: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress > 100 ? 100 : progress} 
            color={goal.isCompleted ? "success" : (isNearDeadline() ? "warning" : "primary")}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {progress.toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Faltam: R$ {(goal.targetAmount - goal.currentAmount).toFixed(2)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Prazo
          </Typography>
          <Typography 
            variant="body2"
            color={isNearDeadline() ? 'warning.main' : 'text.primary'}
          >
            {formattedDeadline}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onEdit}>Editar</Button>
        {!goal.isCompleted && (
          <Button size="small" color="primary">Contribuir</Button>
        )}
      </CardActions>
    </Card>
  );
};

export default GoalCard;
