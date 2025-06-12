import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Switch, 
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery } from '@tanstack/react-query';
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Estados para senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados para MFA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  // Buscar perfil do usuário
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
    onSuccess: (data) => {
      setName(data.user.name);
      setEmail(data.user.email);
      setMfaEnabled(data.user.mfaEnabled);
    }
  });

  // Mutação para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => authService.updateProfile(data),
    onSuccess: () => {
      enqueueSnackbar('Perfil atualizado com sucesso!', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao atualizar perfil', { variant: 'error' });
    }
  });

  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: () => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      enqueueSnackbar('Senha alterada com sucesso!', { variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao alterar senha', { variant: 'error' });
    }
  });

  // Mutação para configurar MFA
  const setupMfaMutation = useMutation({
    mutationFn: () => authService.setupMfa(),
    onSuccess: (data) => {
      setMfaQrCode(data.qrCode);
      setMfaSecret(data.secret);
      setShowMfaSetup(true);
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao configurar MFA', { variant: 'error' });
    }
  });

  // Mutação para ativar MFA
  const enableMfaMutation = useMutation({
    mutationFn: () => authService.enableMfa(mfaCode),
    onSuccess: () => {
      enqueueSnackbar('Autenticação em duas etapas ativada com sucesso!', { variant: 'success' });
      setMfaEnabled(true);
      setShowMfaSetup(false);
      setMfaCode('');
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Código inválido', { variant: 'error' });
    }
  });

  // Mutação para desativar MFA
  const disableMfaMutation = useMutation({
    mutationFn: () => authService.disableMfa(currentPassword),
    onSuccess: () => {
      enqueueSnackbar('Autenticação em duas etapas desativada com sucesso!', { variant: 'success' });
      setMfaEnabled(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error.response?.data?.message || 'Erro ao desativar MFA', { variant: 'error' });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      enqueueSnackbar('As senhas não coincidem', { variant: 'error' });
      return;
    }
    
    changePasswordMutation.mutate();
  };

  const handleSetupMfa = () => {
    setupMfaMutation.mutate();
  };

  const handleEnableMfa = (e: React.FormEvent) => {
    e.preventDefault();
    enableMfaMutation.mutate();
  };

  const handleDisableMfa = () => {
    disableMfaMutation.mutate();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Configurações
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="configurações"
        >
          <Tab label="Perfil" />
          <Tab label="Segurança" />
          <Tab label="Notificações" />
          <Tab label="Preferências" />
        </Tabs>

        {/* Tab de Perfil */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleUpdateProfile} noValidate>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Informações Pessoais
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Nome completo"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? <CircularProgress size={24} /> : 'Salvar alterações'}
            </Button>
          </Box>
        </TabPanel>

        {/* Tab de Segurança */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Alterar Senha
            </Typography>
            <Box component="form" onSubmit={handleChangePassword} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Senha atual"
                type={showPassword ? 'text' : 'password'}
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                name="newPassword"
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar nova senha"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 3 }}
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? <CircularProgress size={24} /> : 'Alterar senha'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Autenticação em Duas Etapas
            </Typography>
            
            {!mfaEnabled && !showMfaSetup ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  A autenticação em duas etapas adiciona uma camada extra de segurança à sua conta.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleSetupMfa}
                  disabled={setupMfaMutation.isPending}
                >
                  {setupMfaMutation.isPending ? <CircularProgress size={24} /> : 'Configurar autenticação em duas etapas'}
                </Button>
              </Box>
            ) : null}
            
            {showMfaSetup && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Escaneie o QR code abaixo com um aplicativo de autenticação como Google Authenticator ou Authy.
                </Alert>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <img src={mfaQrCode} alt="QR Code para autenticação em duas etapas" />
                </Box>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Ou insira este código manualmente: <strong>{mfaSecret}</strong>
                </Typography>
                
                <Box component="form" onSubmit={handleEnableMfa} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="mfaCode"
                    label="Código de verificação"
                    name="mfaCode"
                    autoComplete="one-time-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={enableMfaMutation.isPending}
                  >
                    {enableMfaMutation.isPending ? <CircularProgress size={24} /> : 'Verificar e ativar'}
                  </Button>
                </Box>
              </Box>
            )}
            
            {mfaEnabled && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  A autenticação em duas etapas está ativada para sua conta.
                </Alert>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisableMfa}
                  disabled={disableMfaMutation.isPending}
                >
                  {disableMfaMutation.isPending ? <CircularProgress size={24} /> : 'Desativar autenticação em duas etapas'}
                </Button>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab de Notificações */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preferências de Notificação
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Notificações por email"
          />
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Alertas de transações"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Lembretes de metas"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch />}
              label="Dicas e novidades"
            />
          </Box>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
          >
            Salvar preferências
          </Button>
        </TabPanel>

        {/* Tab de Preferências */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preferências do Sistema
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Tema escuro"
          />
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Mostrar saldos na página inicial"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Mostrar gráficos detalhados"
            />
          </Box>
          <Button
            variant="contained"
            sx={{ mt: 3 }}
          >
            Salvar preferências
          </Button>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
