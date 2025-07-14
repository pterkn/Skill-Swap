
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#023020', // Hunter Green
      contrastText: '#FEFFEC' // Ivory text on buttons, etc
    },
    background: {
      default: '#FEFFEC', // App background
      paper: '#FFFFFF'    // Card background
    },
    text: {
      primary: '#023020',
      secondary: '#555'
    }
  },
  typography: {
    fontFamily: 'Georgia, serif',
    h1: { fontWeight: 'bold' },
    h2: { fontWeight: 'bold' },
    h3: { fontWeight: 'bold' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Disable ALL CAPS
          borderRadius: 6
        }
      }
    }
  }
});

export default theme;
