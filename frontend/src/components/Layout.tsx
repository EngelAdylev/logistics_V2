import { Box, AppBar, Toolbar, Typography, Drawer, List,
         ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_WIDTH = 220;
const APPBAR_HEIGHT = 64;

const NAV_ITEMS = [
  { label: 'Поезда',    path: '/trains',   icon: <DirectionsRailwayIcon />, adminOnly: false },
  { label: 'Карта',     path: '/map',      icon: <MapIcon />,              adminOnly: true  },
  { label: 'Накладные', path: '/invoices', icon: <ReceiptLongIcon />,      adminOnly: true  },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { auth, logout } = useAuth();
  const admin = auth?.role === 'ADMIN';
  const isMap = pathname === '/map';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || admin);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
            Дислокация вагонов
          </Typography>
          {auth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {auth.username}
              </Typography>
              <Tooltip title="Выйти">
                <IconButton color="inherit" size="small" onClick={handleLogout}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            top: `${APPBAR_HEIGHT}px`,
            height: `calc(100% - ${APPBAR_HEIGHT}px)`,
            boxSizing: 'border-box',
          },
        }}>
        <List>
          {visibleItems.map(item => (
            <ListItemButton key={item.path}
              selected={pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${APPBAR_HEIGHT}px`,
          height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
          overflow: isMap ? 'hidden' : 'auto',
          p: isMap ? 0 : 3,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Outlet />
      </Box>
    </Box>
  );
}
