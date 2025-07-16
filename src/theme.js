import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#023020', // Hunter Green
      contrastText: '#FEFFEC', // Ivory text
    },
    secondary: {
      main: '#097969', // Emerald/Dark Green
    },
    background: {
      default: '#FEFFEC', // Ivory background
      paper: '#fff',
    },
    text: {
      primary: '#333',
    },
    info: {
      main: '#1976d2',
    },
    success: {
      main: '#388e3c',
    },
    error: {
      main: '#d32f2f',
    }
  },
  typography: {
    fontFamily: 'Georgia, serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h4: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0, // 🚫 remove curved edges from the header
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FEFFEC',
          borderRadius: 10,
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 6,
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
        }
      }
    }
  }
});

export default theme;
