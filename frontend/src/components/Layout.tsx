import { Box, AppBar, Toolbar, Typography, Drawer, List,
         ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import TrainIcon from '@mui/icons-material/Train';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_WIDTH = 220;

const NAV_ITEMS = [
  { label: 'Карта',   path: '/map',    icon: <MapIcon /> },
  { label: 'Вагоны',  path: '/wagons', icon: <TrainIcon /> },
  { label: 'Рейсы',   path: '/trips',  icon: <DirectionsRailwayIcon /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300, bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={600}>
            Дислокация вагонов
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent"
        sx={{ width: SIDEBAR_WIDTH,
              '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, mt: '64px' } }}>
        <List>
          {NAV_ITEMS.map(item => (
            <ListItemButton key={item.path}
              selected={pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main"
        sx={{ flexGrow: 1, mt: '64px', ml: `${SIDEBAR_WIDTH}px`, p: 2, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
