import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Typography,
  Alert
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { goalService } from '../../services/api';

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: any;
}

interface GoalFormData {
  title: string;
  description: string;
  targetAmount: number;
  deadline: Date | null;
  icon: string;
  color: string;
}

const goalIcons = [
  { value: '🏠', label: 'Casa' },
  { value: '🚗', label: 'Carro' },
  { value: '✈️', label: 'Viagem' },
  { value: '🎓', label: 'Educação' },
  { value: '💰', label: 'Investimento' },
  { value: '🏥', label: 'Saúde' },
  { value: '🎯', label: 'Meta Geral' },
  { value: '💍', label: 'Casamento' },
  { value: '👶', label: 'Família' },
  { value: '🏖️', label: 'Férias' }
];

const goalColors = [
  { value: '#1976d2', label: 'Azul' },
  { value: '#388e3c', label: 'Verde' },
  { value: '#f57c00', label: 'Laranja' },
  { value: '#d32f2f', label: 'Vermelho' },
  { value: '#7b1fa2', label: 'Roxo' },
  { value: '#0288d1', label: 'Azul Claro' },
  { value: '#689f38', label: 'Verde Claro' },
  { value: '#fbc02d', label: 'Amarelo' }
];

const GoalDialog: React.FC<GoalDialogProps> = ({ open, onClose, goal }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEditing = !!goal;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<GoalFormData>({
    defaultValues: {
      title: '',
      description: '',
      targetAmount: 0,
      deadline: null,
      icon: '🎯',
      color: '#1976d2'
    }
  });

  // Resetar formulário quando o diálogo abrir/fechar
  React.useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          title: goal.title || '',
          description: goal.description || '',
          targetAmount: goal.targetAmount || 0,
          deadline: goal.deadline ? new Date(goal.deadline) : null,
          icon: goal.icon || '🎯',
          color: goal.color || '#1976d2'
        });
      } else {
        reset({
          title: '',
          description: '',
          targetAmount: 0,
          deadline: null,
          icon: '🎯',
          color: '#1976d2'
        });
      }
    }
  }, [open, goal, reset]);

  // Mutation para criar/editar meta
  const mutation = useMutation({
    mutationFn: (data: GoalFormData) => {
      if (isEditing) {
        return goalService.update(goal.id, data);
      }
      return goalService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      enqueueSnackbar(
        isEditing ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!',
        { variant: 'success' }
      );
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Erro ao salvar meta',
        { variant: 'error' }
      );
    }
  });

  const onSubmit = (data: GoalFormData) => {
    mutation.mutate(data);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Meta' : 'Nova Meta Financeira'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Título */}
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Título é obrigatório' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Título da Meta"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />

              {/* Descrição */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição (opcional)"
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />

              {/* Valor alvo */}
              <Controller
                name="targetAmount"
                control={control}
                rules={{ 
                  required: 'Valor alvo é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Valor Alvo"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!errors.targetAmount}
                    helperText={errors.targetAmount?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />

              {/* Data limite */}
              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Data Limite (opcional)"
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.deadline,
                        helperText: errors.deadline?.message
                      }
                    }}
                  />
                )}
              />

              {/* Ícone */}
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Ícone</InputLabel>
                    <Select {...field} label="Ícone">
                      {goalIcons.map((icon) => (
                        <MenuItem key={icon.value} value={icon.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">{icon.value}</Typography>
                            <Typography>{icon.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Cor */}
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Cor</InputLabel>
                    <Select {...field} label="Cor">
                      {goalColors.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: color.value,
                                borderRadius: '50%'
                              }}
                            />
                            <Typography>{color.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Informação sobre contribuições */}
              {isEditing && goal && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Valor atual: R$ {goal.currentAmount?.toFixed(2) || '0,00'}
                  </Typography>
                  <Typography variant="body2">
                    Progresso: {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                  </Typography>
                </Alert>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Meta')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GoalDialog;

