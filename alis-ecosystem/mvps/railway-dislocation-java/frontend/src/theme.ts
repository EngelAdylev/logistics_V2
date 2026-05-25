import { createTheme } from '@mui/material/styles';
// augment theme to include MuiDataGrid component overrides
import type {} from '@mui/x-data-grid/themeAugmentation';

export const theme = createTheme({
  palette: {
    primary:   { main: '#1a3c6e' },
    secondary: { main: '#e8f0fe' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: { border: 'none', fontSize: 13 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 6 },
      },
    },
  },
});
