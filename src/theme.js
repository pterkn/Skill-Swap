// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#023020',        // Hunter Green
      contrastText: '#FEFFEC' // Ivory
    },
    secondary: {
      main: '#7FB77E',         // Soft green accent (optional)
      contrastText: '#fff'
    },
    background: {
      default: '#FEFFEC',     // Ivory
      paper: '#ffffff'
    },
    text: {
      primary: '#023020',     // Hunter Green for text
      secondary: '#4d4d4d'
    },
    error: {
      main: '#d32f2f'
    }
  },
  typography: {
    fontFamily: 'Georgia, serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '0.6rem 1.2rem',
          fontWeight: 'bold',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FEFFEC',
          borderRadius: 12
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 6
        }
      }
    }
  }
});

export default theme;
