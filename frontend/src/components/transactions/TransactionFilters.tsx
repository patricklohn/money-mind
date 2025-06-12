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
  Chip,
  Grid
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { categoryService, walletService } from '../../services/api';
import { Clear as ClearIcon } from '@mui/icons-material';

interface TransactionFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters: any;
}

interface FilterFormData {
  startDate: Date | null;
  endDate: Date | null;
  type: string;
  categoryId: number | '';
  walletId: number | '';
  minAmount: string;
  maxAmount: string;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({ 
  open, 
  onClose, 
  onApply, 
  initialFilters 
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue
  } = useForm<FilterFormData>({
    defaultValues: {
      startDate: null,
      endDate: null,
      type: 'all',
      categoryId: '',
      walletId: '',
      minAmount: '',
      maxAmount: ''
    }
  });

  const selectedType = watch('type');

  // Buscar categorias
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', selectedType],
    queryFn: () => categoryService.getAll(selectedType === 'all' ? undefined : selectedType),
    enabled: open
  });

  // Buscar carteiras
  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAll(),
    enabled: open
  });

  // Resetar formulário quando o diálogo abrir
  React.useEffect(() => {
    if (open) {
      reset({
        startDate: initialFilters.startDate ? new Date(initialFilters.startDate) : null,
        endDate: initialFilters.endDate ? new Date(initialFilters.endDate) : null,
        type: initialFilters.type || 'all',
        categoryId: initialFilters.categoryId || '',
        walletId: initialFilters.walletId || '',
        minAmount: initialFilters.minAmount || '',
        maxAmount: initialFilters.maxAmount || ''
      });
    }
  }, [open, initialFilters, reset]);

  const onSubmit = (data: FilterFormData) => {
    const filters = {
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      categoryId: data.categoryId || null,
      walletId: data.walletId || null,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount
    };
    onApply(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterFormData = {
      startDate: null,
      endDate: null,
      type: 'all',
      categoryId: '',
      walletId: '',
      minAmount: '',
      maxAmount: ''
    };
    reset(clearedFilters);
    onApply(clearedFilters);
  };

  const handleQuickDateFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setValue('startDate', startDate);
    setValue('endDate', endDate);
  };

  const categories = categoriesData?.categories || [];
  const wallets = walletsData?.wallets || [];

  // Contar filtros ativos
  const activeFiltersCount = Object.values(initialFilters).filter(value => 
    value !== null && value !== '' && value !== 'all'
  ).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Filtrar Transações
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip 
                label={`${activeFiltersCount} filtro(s) ativo(s)`} 
                color="primary" 
                size="small" 
              />
            )}
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Período */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Período
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Data Inicial"
                          maxDate={new Date()}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          label="Data Final"
                          maxDate={new Date()}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                
                {/* Filtros rápidos de data */}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleQuickDateFilter(7)}
                  >
                    Últimos 7 dias
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleQuickDateFilter(30)}
                  >
                    Últimos 30 dias
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleQuickDateFilter(90)}
                  >
                    Últimos 3 meses
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleQuickDateFilter(365)}
                  >
                    Último ano
                  </Button>
                </Box>
              </Box>

              {/* Tipo de transação */}
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Transação</InputLabel>
                    <Select {...field} label="Tipo de Transação">
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="income">Receitas</MenuItem>
                      <MenuItem value="expense">Despesas</MenuItem>
                      <MenuItem value="transfer">Transferências</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              {/* Categoria */}
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select {...field} label="Categoria">
                      <MenuItem value="">Todas as categorias</MenuItem>
                      {categories.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{category.icon}</Typography>
                            <Typography>{category.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Carteira */}
              <Controller
                name="walletId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Carteira</InputLabel>
                    <Select {...field} label="Carteira">
                      <MenuItem value="">Todas as carteiras</MenuItem>
                      {wallets.map((wallet: any) => (
                        <MenuItem key={wallet.id} value={wallet.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{wallet.icon}</Typography>
                            <Typography>{wallet.name}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Faixa de valores */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Faixa de Valores
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="minAmount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Valor Mínimo"
                          type="number"
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="maxAmount"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Valor Máximo"
                          type="number"
                          fullWidth
                          InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button 
              onClick={handleClearFilters} 
              startIcon={<ClearIcon />}
              color="inherit"
            >
              Limpar Filtros
            </Button>
            <Button onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              Aplicar Filtros
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TransactionFilters;

