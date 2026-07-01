import { Box, AppBar, Toolbar, Typography, Drawer, List,
         ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip, Avatar } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TrainIcon from '@mui/icons-material/Train';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_WIDTH = 224;
const APPBAR_HEIGHT = 60;

const NAV_ITEMS = [
  { label: 'Дислокация', path: '/dislocation', icon: <TableRowsIcon /> },
  { label: 'Поезда',     path: '/trains',      icon: <DirectionsRailwayIcon /> },
  { label: 'Карта',      path: '/map',         icon: <MapIcon /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { auth, logout } = useAuth();
  const isMap = pathname === '/map';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="fixed"
        elevation={0}
        sx={{
          zIndex: 1300,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
        <Toolbar sx={{ minHeight: `${APPBAR_HEIGHT}px !important`, gap: 1.5 }}>
          <Avatar variant="rounded"
            sx={{ bgcolor: 'primary.main', width: 32, height: 32, borderRadius: 2 }}>
            <TrainIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
              ЛКДС · Дислокация
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1}>
              Круглое Поле · вагоны и рейсы
            </Typography>
          </Box>
          {auth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">{auth.username}</Typography>
              <Tooltip title="Выйти">
                <IconButton size="small" onClick={handleLogout}>
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
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}>
        <List sx={{ px: 1.5, py: 2 }}>
          {NAV_ITEMS.map(item => {
            const selected = pathname.startsWith(item.path);
            return (
              <ListItemButton key={item.path}
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: selected ? 'primary.main' : 'text.secondary',
                  '&.Mui-selected': { bgcolor: 'primary.light' },
                  '&.Mui-selected:hover': { bgcolor: 'primary.light' },
                }}>
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label}
                  primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: 14 }} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${APPBAR_HEIGHT}px`,
          height: `calc(100vh - ${APPBAR_HEIGHT}px)`,
          overflow: isMap ? 'hidden' : 'auto',
          p: isMap ? 0 : 2.5,
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Outlet />
      </Box>
    </Box>
  );
}
