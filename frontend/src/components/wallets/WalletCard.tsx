import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { walletService } from '../../services/api';

interface WalletCardProps {
  wallet: any;
  onEdit: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, onEdit }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Mutation para deletar carteira
  const deleteMutation = useMutation({
    mutationFn: () => walletService.delete(wallet.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      enqueueSnackbar('Carteira excluída com sucesso!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Erro ao excluir carteira',
        { variant: 'error' }
      );
    }
  });

  // Mutation para definir como padrão
  const setDefaultMutation = useMutation({
    mutationFn: () => walletService.update(wallet.id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      enqueueSnackbar('Carteira definida como padrão!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || 'Erro ao definir carteira padrão',
        { variant: 'error' }
      );
    }
  });

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta carteira? Esta ação não pode ser desfeita.')) {
      deleteMutation.mutate();
    }
    handleMenuClose();
  };

  const handleSetDefault = () => {
    setDefaultMutation.mutate();
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit();
    handleMenuClose();
  };

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Determinar cor do saldo
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'success.main';
    if (balance < 0) return 'error.main';
    return 'text.primary';
  };

  // Ícone do saldo
  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUpIcon fontSize="small" />;
    if (balance < 0) return <TrendingDownIcon fontSize="small" />;
    return <BalanceIcon fontSize="small" />;
  };

  // Tipo da carteira traduzido
  const getWalletTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      cash: 'Dinheiro',
      bank: 'Conta Bancária',
      credit: 'Cartão de Crédito',
      investment: 'Investimento',
      savings: 'Poupança',
      other: 'Outro'
    };
    return types[type] || type;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* Indicador de carteira padrão */}
      {wallet.isDefault && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1
          }}
        >
          <Chip
            icon={<StarIcon fontSize="small" />}
            label="Padrão"
            size="small"
            color="primary"
            variant="filled"
          />
        </Box>
      )}

      {/* Menu de ações */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{ backgroundColor: 'background.paper', '&:hover': { backgroundColor: 'grey.100' } }}
        >
          <MoreIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          
          {!wallet.isDefault && (
            <MenuItem onClick={handleSetDefault}>
              <ListItemIcon>
                <StarBorderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Definir como padrão</ListItemText>
            </MenuItem>
          )}
          
          <Divider />
          
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: wallet.isDefault ? 5 : 3 }}>
        {/* Ícone e nome da carteira */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h4" component="span">
            {wallet.icon}
          </Typography>
          <Box>
            <Typography variant="h6" component="div" noWrap>
              {wallet.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getWalletTypeLabel(wallet.type)}
            </Typography>
          </Box>
        </Box>

        {/* Saldo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ color: getBalanceColor(wallet.balance) }}>
            {getBalanceIcon(wallet.balance)}
          </Box>
          <Typography 
            variant="h5" 
            component="div"
            sx={{ 
              color: getBalanceColor(wallet.balance),
              fontWeight: 'bold'
            }}
          >
            {formatCurrency(wallet.balance || 0)}
          </Typography>
        </Box>

        {/* Informações adicionais */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Última atualização: {wallet.updatedAt ? 
              new Date(wallet.updatedAt).toLocaleDateString('pt-BR') : 
              'Não disponível'
            }
          </Typography>
          
          {/* Status do saldo */}
          <Box>
            {wallet.balance > 1000 && (
              <Chip 
                label="Saldo Alto" 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            )}
            {wallet.balance < 0 && (
              <Chip 
                label="Saldo Negativo" 
                size="small" 
                color="error" 
                variant="outlined" 
              />
            )}
            {wallet.balance >= 0 && wallet.balance <= 100 && (
              <Chip 
                label="Saldo Baixo" 
                size="small" 
                color="warning" 
                variant="outlined" 
              />
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          ID: {wallet.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {wallet.isDefault && (
            <StarIcon fontSize="small" color="primary" />
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default WalletCard;

