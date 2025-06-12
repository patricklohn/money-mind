import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Box, Badge } from '@mui/material';
import { Menu as MenuIcon, Notifications, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  drawerWidth: number;
  handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ drawerWidth, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  // Obter dados do usuário do localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };
  
  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          MoneyMind
        </Typography>
        
        {/* Notificações */}
        <IconButton color="inherit" sx={{ mr: 2 }}>
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>
        
        {/* Menu do usuário */}
        <Box>
          <IconButton
            onClick={handleMenu}
            color="inherit"
            size="large"
            edge="end"
            aria-label="conta do usuário atual"
            aria-controls="menu-appbar"
            aria-haspopup="true"
          >
            {user?.profileImage ? (
              <Avatar 
                alt={user.name} 
                src={user.profileImage} 
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.name || 'Usuário'}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleSettings}>Configurações</MenuItem>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
