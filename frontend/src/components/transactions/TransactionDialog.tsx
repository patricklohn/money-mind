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
  ToggleButton,
  ToggleButtonGroup,
  Alert
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { transactionService, categoryService, walletService } from '../../services/api';
import { 
  TrendingUp as IncomeIcon, 
  TrendingDown as ExpenseIcon, 
  SwapHoriz as TransferIcon 
} from '@mui/icons-material';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: any;
}

interface TransactionFormData {
  description: string;
  amount: number;
  transactionDate: Date;
  transactionType: 'income' | 'expense' | 'transfer';
  categoryId: number | '';
  walletId: number | '';
  notes: string;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({ open, onClose, transaction }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEditing = !!transaction;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<TransactionFormData>({
    defaultValues: {
      description: '',
      amount: 0,
      transactionDate: new Date(),
      transactionType: 'expense',
      categoryId: '',
      walletId: '',
      notes: ''
    }
  });

  const transactionType = watch('transactionType');

  // Buscar categorias
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', transactionType],
    queryFn: () => categoryService.getAll(transactionType === 'transfer' ? undefined : transactionType),
    enabled: open
  });

  // Buscar carteiras
  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAll(),
    enabled: open
  });

  // Resetar formulário quando o diálogo abrir/fechar
  React.useEffect(() => {
    if (open) {
      if (transaction) {
        reset({
          description: transaction.description || '',
          amount: Math.abs(transaction.amount) || 0,
          transactionDate: transaction.transactionDate ? new Date(transaction.transactionDate) : new Date(),
          transactionType: transaction.transactionType || 'expense',
          categoryId: transaction.categoryId || '',
          walletId: transaction.walletId || '',
          notes: transaction.notes || ''
        });
      } else {
        reset({
          description: '',
          amount: 0,
          transactionDate: new Date(),
          transactionType: 'expense',
          categoryId: '',
          walletId: '',
          notes: ''
        });
      }
    }
  }, [open, transaction, reset]);

  // Mutation para criar/editar transação
  const mutation = useMutation({
    mutationFn: (data: TransactionFormData) => {
      const payload = {
        ...data,
        amount: data.transactionType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
      };
      
      if (isEditing) {
        return transactionService.update(transaction.id, payload);
      }
      return transactionService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      enqueueSnackbar(
        isEditing ? 'Transação atualizada com sucesso!' : 'Transação criada com sucesso!',
        { variant: 'success' }
      );
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Erro ao salvar transação',
        { variant: 'error' }
      );
    }
  });

  const onSubmit = (data: TransactionFormData) => {
    if (!data.categoryId || !data.walletId) {
      enqueueSnackbar('Por favor, selecione uma categoria e carteira', { variant: 'error' });
      return;
    }
    mutation.mutate(data);
  };

  const categories = categoriesData?.categories || [];
  const wallets = walletsData?.wallets || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Tipo de transação */}
              <Controller
                name="transactionType"
                control={control}
                render={({ field }) => (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Tipo de Transação
                    </Typography>
                    <ToggleButtonGroup
                      {...field}
                      exclusive
                      fullWidth
                      size="large"
                    >
                      <ToggleButton value="income" color="success">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IncomeIcon />
                          <Typography>Receita</Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="expense" color="error">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ExpenseIcon />
                          <Typography>Despesa</Typography>
                        </Box>
                      </ToggleButton>
                      <ToggleButton value="transfer" color="info">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TransferIcon />
                          <Typography>Transferência</Typography>
                        </Box>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
              />

              {/* Descrição */}
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Descrição é obrigatória' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descrição"
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />

              {/* Valor */}
              <Controller
                name="amount"
                control={control}
                rules={{ 
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Valor"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />

              {/* Data */}
              <Controller
                name="transactionDate"
                control={control}
                rules={{ required: 'Data é obrigatória' }}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Data da Transação"
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.transactionDate,
                        helperText: errors.transactionDate?.message
                      }
                    }}
                  />
                )}
              />

              {/* Categoria */}
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: 'Categoria é obrigatória' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.categoryId}>
                    <InputLabel>Categoria</InputLabel>
                    <Select {...field} label="Categoria">
                      {categories.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{category.icon}</Typography>
                            <Typography>{category.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.categoryId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Carteira */}
              <Controller
                name="walletId"
                control={control}
                rules={{ required: 'Carteira é obrigatória' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.walletId}>
                    <InputLabel>Carteira</InputLabel>
                    <Select {...field} label="Carteira">
                      {wallets.map((wallet: any) => (
                        <MenuItem key={wallet.id} value={wallet.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{wallet.icon}</Typography>
                            <Typography>{wallet.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              (R$ {wallet.balance?.toFixed(2) || '0,00'})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.walletId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.walletId.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Observações */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observações (opcional)"
                    fullWidth
                    multiline
                    rows={3}
                  />
                )}
              />

              {/* Aviso para transferências */}
              {transactionType === 'transfer' && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Para transferências, selecione a carteira de origem. 
                    Você poderá selecionar a carteira de destino na próxima etapa.
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
              {mutation.isPending ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Transação')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TransactionDialog;

