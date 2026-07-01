import { createTheme } from '@mui/material/styles';
// augment theme to include MuiDataGrid component overrides
import type {} from '@mui/x-data-grid/themeAugmentation';

export const theme = createTheme({
  palette: {
    primary:   { main: '#2457d6', dark: '#1b409c', light: '#e8efff' },
    secondary: { main: '#0f172a' },
    success:   { main: '#16a34a' },
    error:     { main: '#dc2626' },
    background: { default: '#f1f4f9', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", system-ui, "Segoe UI", Roboto, sans-serif',
    fontSize: 13,
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 } },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiDataGrid: {
      styleOverrides: {
        root: { border: 'none', fontSize: 13 },
      },
    },
  },
});
