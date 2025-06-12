import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const NotFound: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: 500
        }}
      >
        <Typography variant="h1" color="primary" sx={{ fontSize: '5rem', fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Página não encontrada
        </Typography>
        <Typography variant="body1" color="text.secondary">
          A página que você está procurando não existe ou foi movida.
        </Typography>
      </Paper>
    </Box>
  );
};

export default NotFound;
