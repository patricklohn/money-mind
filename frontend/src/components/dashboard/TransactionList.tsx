import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interface para transação
interface Transaction {
  id: number;
  description: string;
  amount: number;
  transactionDate: string;
  transactionType: 'income' | 'expense' | 'transfer';
  category: {
    name: string;
    icon: string;
    color: string;
  };
  wallet: {
    name: string;
    icon: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
}

/**
 * Componente de lista de transações
 * Exibe uma tabela com as transações recentes
 */
const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  // Formatar valor para moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy', { locale: ptBR });
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="tabela de transações">
        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Carteira</TableCell>
            <TableCell align="right">Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                  Nenhuma transação encontrada
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2">{transaction.description}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    avatar={<Avatar sx={{ bgcolor: 'transparent' }}>{transaction.category.icon}</Avatar>}
                    label={transaction.category.name}
                    size="small"
                    sx={{ 
                      bgcolor: `${transaction.category.color}20`,
                      color: transaction.category.color,
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {transaction.wallet.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        transaction.transactionType === 'income'
                          ? 'success.main'
                          : transaction.transactionType === 'expense'
                          ? 'error.main'
                          : 'text.primary',
                      fontWeight: 500
                    }}
                  >
                    {transaction.transactionType === 'income' ? '+' : transaction.transactionType === 'expense' ? '-' : ''}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionList;
