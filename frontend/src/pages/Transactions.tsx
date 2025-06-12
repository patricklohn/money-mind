import React from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, FilterList as FilterIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services/api';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes
import TransactionDialog from '../components/transactions/TransactionDialog';
import TransactionFilters from '../components/transactions/TransactionFilters';

const Transactions: React.FC = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openFilters, setOpenFilters] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<any>(null);
  const [filters, setFilters] = React.useState({
    startDate: null,
    endDate: null,
    type: 'all',
    categoryId: null,
    walletId: null,
    minAmount: '',
    maxAmount: '',
  });

  // Buscar transações
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionService.getAll(filters),
  });

  const handleOpenDialog = (transaction = null) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
  };

  const handleOpenFilters = () => {
    setOpenFilters(true);
  };

  const handleCloseFilters = () => {
    setOpenFilters(false);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setOpenFilters(false);
  };

  const handleExportCSV = () => {
    // Implementar exportação para CSV
    console.log('Exportar para CSV');
  };

  const columns: GridColDef[] = [
    {
      field: 'transactionDate',
      headerName: 'Data',
      width: 120,
      valueFormatter: (params) => {
        return format(new Date(params.value), 'dd/MM/yyyy', { locale: ptBR });
      },
    },
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'category',
      headerName: 'Categoria',
      width: 150,
      valueGetter: (params) => params.row.category?.name || '-',
      renderCell: (params) => (
        <Chip 
          label={params.row.category?.name || '-'} 
          size="small" 
          sx={{ 
            backgroundColor: params.row.category?.color || 'grey.300',
            color: '#fff'
          }} 
        />
      ),
    },
    {
      field: 'wallet',
      headerName: 'Carteira',
      width: 150,
      valueGetter: (params) => params.row.wallet?.name || '-',
    },
    {
      field: 'amount',
      headerName: 'Valor',
      width: 150,
      type: 'number',
      valueFormatter: (params) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(params.value);
      },
      cellClassName: (params) => {
        return params.row.transactionType === 'income' ? 'income-cell' : 'expense-cell';
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button 
            size="small" 
            onClick={() => handleOpenDialog(params.row)}
          >
            Editar
          </Button>
        </Box>
      ),
    },
  ];

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
          Erro ao carregar transações. Por favor, tente novamente.
        </Typography>
      </Box>
    );
  }

  const transactions = data?.transactions || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Transações
        </Typography>
        <Box>
          <Tooltip title="Filtrar transações">
            <IconButton onClick={handleOpenFilters} sx={{ mr: 1 }}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar para CSV">
            <IconButton onClick={handleExportCSV} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Transação
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
            sorting: {
              sortModel: [{ field: 'transactionDate', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            '& .income-cell': {
              color: 'success.main',
            },
            '& .expense-cell': {
              color: 'error.main',
            },
          }}
        />
      </Paper>

      {/* Diálogo para criar/editar transação */}
      <TransactionDialog
        open={openDialog}
        onClose={handleCloseDialog}
        transaction={selectedTransaction}
      />

      {/* Diálogo de filtros */}
      <TransactionFilters
        open={openFilters}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </Box>
  );
};

export default Transactions;
