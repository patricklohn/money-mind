import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container, 
  Avatar, 
  Grid,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Estados para login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para registro
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Mutação para login
  const loginMutation = useMutation({
    mutationFn: () => authService.login(loginEmail, loginPassword),
    onSuccess: (data) => {
      if (data.mfaRequired) {
        setMfaRequired(true);
        setMfaToken(data.mfaToken);
        enqueueSnackbar('Verificação em duas etapas necessária', { variant: 'info' });
      } else {
        // Salvar token e dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirecionar para a página inicial ou página anterior
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        
        enqueueSnackbar('Login realizado com sucesso!', { variant: 'success' });
      }
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao fazer login', { variant: 'error' });
    }
  });

  // Mutação para verificação MFA
  const verifyMfaMutation = useMutation({
    mutationFn: () => authService.verifyMfa(mfaToken, mfaCode),
    onSuccess: (data) => {
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirecionar para a página inicial ou página anterior
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      enqueueSnackbar('Login realizado com sucesso!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Código inválido', { variant: 'error' });
    }
  });

  // Mutação para registro
  const registerMutation = useMutation({
    mutationFn: () => authService.register(registerName, registerEmail, registerPassword),
    onSuccess: (data) => {
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirecionar para a página inicial
      navigate('/dashboard', { replace: true });
      
      enqueueSnackbar('Conta criada com sucesso!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao criar conta', { variant: 'error' });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMfaMutation.mutate();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senha
    if (registerPassword !== registerConfirmPassword) {
      enqueueSnackbar('As senhas não coincidem', { variant: 'error' });
      return;
    }
    
    registerMutation.mutate();
  };

  // Renderizar formulário MFA
  if (mfaRequired) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5">
            Verificação em duas etapas
          </Typography>
          <Box component="form" onSubmit={handleMfaSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="mfaCode"
              label="Código de verificação"
              name="mfaCode"
              autoComplete="one-time-code"
              autoFocus
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={verifyMfaMutation.isPending}
            >
              {verifyMfaMutation.isPending ? <CircularProgress size={24} /> : 'Verificar'}
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          MoneyMind
        </Typography>
        <Paper sx={{ width: '100%', mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Login" />
            <Tab label="Criar conta" />
          </Tabs>
          
          {/* Tab de Login */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ px: 3, pb: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? <CircularProgress size={24} /> : 'Entrar'}
              </Button>
            </Box>
          </TabPanel>
          
          {/* Tab de Registro */}
          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegisterSubmit} noValidate sx={{ px: 3, pb: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Nome completo"
                name="name"
                autoComplete="name"
                autoFocus
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="registerEmail"
                label="Email"
                name="email"
                autoComplete="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="registerPassword"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                id="registerPassword"
                autoComplete="new-password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar senha"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? <CircularProgress size={24} /> : 'Criar conta'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
