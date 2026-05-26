import { AppBar, Box, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const tab = location.pathname.startsWith('/orders') ? 1 : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ALIS Analytics Hub
          </Typography>
        </Toolbar>
        <Tabs value={tab} textColor="inherit" indicatorColor="secondary"
          sx={{ px: 2 }}>
          <Tab label="Datareon" onClick={() => navigate('/')} />
          <Tab label="Заказы" onClick={() => navigate('/orders')} />
        </Tabs>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
