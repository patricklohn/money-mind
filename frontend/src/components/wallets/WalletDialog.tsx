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
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { walletService } from '../../services/api';

interface WalletDialogProps {
  open: boolean;
  onClose: () => void;
  wallet?: any;
}

interface WalletFormData {
  name: string;
  icon: string;
  balance: number;
  type: string;
  isDefault: boolean;
}

const walletTypes = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'bank', label: 'Conta Bancária' },
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'investment', label: 'Investimento' },
  { value: 'savings', label: 'Poupança' },
  { value: 'other', label: 'Outro' }
];

const walletIcons = [
  { value: '💰', label: 'Dinheiro' },
  { value: '🏦', label: 'Banco' },
  { value: '💳', label: 'Cartão' },
  { value: '📈', label: 'Investimento' },
  { value: '🐷', label: 'Poupança' },
  { value: '💎', label: 'Tesouro' },
  { value: '🏠', label: 'Casa' },
  { value: '🚗', label: 'Veículo' },
  { value: '📱', label: 'Digital' },
  { value: '🎯', label: 'Meta' }
];

const WalletDialog: React.FC<WalletDialogProps> = ({ open, onClose, wallet }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isEditing = !!wallet;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<WalletFormData>({
    defaultValues: {
      name: '',
      icon: '💰',
      balance: 0,
      type: 'cash',
      isDefault: false
    }
  });

  // Resetar formulário quando o diálogo abrir/fechar
  React.useEffect(() => {
    if (open) {
      if (wallet) {
        reset({
          name: wallet.name || '',
          icon: wallet.icon || '💰',
          balance: wallet.balance || 0,
          type: wallet.type || 'cash',
          isDefault: wallet.isDefault || false
        });
      } else {
        reset({
          name: '',
          icon: '💰',
          balance: 0,
          type: 'cash',
          isDefault: false
        });
      }
    }
  }, [open, wallet, reset]);

  // Mutation para criar/editar carteira
  const mutation = useMutation({
    mutationFn: (data: WalletFormData) => {
      if (isEditing) {
        return walletService.update(wallet.id, data);
      }
      return walletService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      enqueueSnackbar(
        isEditing ? 'Carteira atualizada com sucesso!' : 'Carteira criada com sucesso!',
        { variant: 'success' }
      );
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Erro ao salvar carteira',
        { variant: 'error' }
      );
    }
  });

  const onSubmit = (data: WalletFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Editar Carteira' : 'Nova Carteira'}
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Nome */}
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Nome é obrigatório' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Carteira"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="Ex: Conta Corrente, Carteira, Poupança..."
                />
              )}
            />

            {/* Tipo */}
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Tipo de Carteira</InputLabel>
                  <Select {...field} label="Tipo de Carteira">
                    {walletTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    {walletIcons.map((icon) => (
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

            {/* Saldo inicial */}
            <Controller
              name="balance"
              control={control}
              rules={{ 
                required: 'Saldo inicial é obrigatório'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={isEditing ? "Saldo Atual" : "Saldo Inicial"}
                  type="number"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  error={!!errors.balance}
                  helperText={errors.balance?.message || (isEditing ? "Ajuste o saldo conforme necessário" : "Digite o valor atual disponível nesta carteira")}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />

            {/* Informações adicionais */}
            {isEditing ? (
              <Alert severity="info">
                <Typography variant="body2">
                  Ao alterar o saldo, o sistema registrará um ajuste automático para manter o histórico.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info">
                <Typography variant="body2">
                  O saldo inicial será registrado como uma transação de ajuste no histórico.
                </Typography>
              </Alert>
            )}

            {/* Carteira padrão */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <Typography variant="body2">
                      Definir como carteira padrão
                    </Typography>
                  </Box>
                )}
              />
            </Box>
            
            {/* Explicação carteira padrão */}
            <Typography variant="caption" color="text.secondary">
              A carteira padrão será pré-selecionada ao criar novas transações.
            </Typography>
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
            {mutation.isPending ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Carteira')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WalletDialog;

