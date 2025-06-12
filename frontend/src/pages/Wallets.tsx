import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '../services/api';

// Componentes
import WalletDialog from '../components/wallets/WalletDialog';
import WalletCard from '../components/wallets/WalletCard';

const Wallets: React.FC = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState<any>(null);

  // Buscar carteiras
  const { data, isLoading, error } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAll(),
  });

  const handleOpenDialog = (wallet = null) => {
    setSelectedWallet(wallet);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWallet(null);
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
          Erro ao carregar carteiras. Por favor, tente novamente.
        </Typography>
      </Box>
    );
  }

  const wallets = data?.wallets || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Carteiras
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Carteira
        </Button>
      </Box>

      {wallets.length === 0 ? (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Você não tem carteiras cadastradas no momento.
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => handleOpenDialog()}
          >
            Criar sua primeira carteira
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {wallets.map((wallet: any) => (
            <Grid item xs={12} sm={6} md={4} key={wallet.id}>
              <WalletCard 
                wallet={wallet} 
                onEdit={() => handleOpenDialog(wallet)} 
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo para criar/editar carteira */}
      <WalletDialog
        open={openDialog}
        onClose={handleCloseDialog}
        wallet={selectedWallet}
      />
    </Box>
  );
};

export default Wallets;
