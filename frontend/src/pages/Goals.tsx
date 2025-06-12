import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/api';

// Componentes
import GoalDialog from '../components/goals/GoalDialog';
import GoalCard from '../components/goals/GoalCard';

const Goals: React.FC = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<any>(null);

  // Buscar metas
  const { data, isLoading, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getAll(),
  });

  const handleOpenDialog = (goal = null) => {
    setSelectedGoal(goal);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGoal(null);
  };

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
          Erro ao carregar metas. Por favor, tente novamente.
        </Typography>
      </Box>
    );
  }

  const goals = data?.goals || [];
  const activeGoals = goals.filter((goal: any) => !goal.isCompleted);
  const completedGoals = goals.filter((goal: any) => goal.isCompleted);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Metas Financeiras
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Meta
        </Button>
      </Box>

      {/* Metas ativas */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Metas Ativas
      </Typography>
      {activeGoals.length === 0 ? (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Você não tem metas ativas no momento.
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => handleOpenDialog()}
          >
            Criar sua primeira meta
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {activeGoals.map((goal: any) => (
            <Grid item xs={12} sm={6} md={4} key={goal.id}>
              <GoalCard 
                goal={goal} 
                onEdit={() => handleOpenDialog(goal)} 
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Metas concluídas */}
      {completedGoals.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Metas Concluídas
          </Typography>
          <Grid container spacing={3}>
            {completedGoals.map((goal: any) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <GoalCard 
                  goal={goal} 
                  onEdit={() => handleOpenDialog(goal)} 
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Diálogo para criar/editar meta */}
      <GoalDialog
        open={openDialog}
        onClose={handleCloseDialog}
        goal={selectedGoal}
      />
    </Box>
  );
};

export default Goals;
