// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#023020', // Hunter Green
      contrastText: '#FEFFEC', // Ivory text
    },
    secondary: {
      main: '#097969', // Accent green
    },
    background: {
      default: '#FEFFEC', // Global background
      paper: '#ffffff',   // Card background
    },
    text: {
      primary: '#333', // Dark text
    },
    error: {
      main: '#d32f2f', // Error red
    },
    success: {
      main: '#4caf50',
    },
  },

  typography: {
    fontFamily: 'Georgia, serif',
    h1: { fontWeight: 'bold' },
    h2: { fontWeight: 'bold' },
    h3: { fontWeight: 'bold' },
    button: { textTransform: 'none' },
  },

  shape: {
    borderRadius: 8, // Softer buttons and cards
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          padding: '0.6rem 1.2rem',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#04532a',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FEFFEC',
        },
      },
    },
  },
});

export default theme;
