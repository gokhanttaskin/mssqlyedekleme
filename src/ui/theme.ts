import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00bcd4' }, // cyan
    secondary: { main: '#ff4081' }, // pink
    success: { main: '#4caf50' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#0f172a', // slate-900
      paper: '#111827',   // gray-900
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.06)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 }
      }
    }
  }
});

export default theme;