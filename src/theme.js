import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#023020',         // Hunter Green
      contrastText: '#FEFFEC', // Ivory
    },
    secondary: {
      main: '#097969',         // Emerald/Dark Green
    },
    background: {
      default: '#FEFFEC',      // Ivory
      paper: '#ffffff',
    },
    text: {
      primary: '#222',
      secondary: '#555',
    },
    success: {
      main: '#2e7d32',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ffa000',
    },
    info: {
      main: '#0288d1',
    },
    custom: {
      muted: '#aaa',
      highlight: '#e0f2f1'
    }
  },

  typography: {
    fontFamily: `'Georgia', serif`,
    fontSize: 14,
    htmlFontSize: 16,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,

    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.02em' }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FEFFEC',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          borderBottom: '1px solid #ddd',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
          },
          '&:focus': {
            outline: '2px solid #097969',
            outlineOffset: 2
          }
        },
        containedPrimary: {
          backgroundColor: '#023020',
          '&:hover': {
            backgroundColor: '#035232'
          }
        },
        outlinedPrimary: {
          borderColor: '#023020',
          color: '#023020',
          '&:hover': {
            backgroundColor: '#f1f8f5',
          }
        }
      }
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FEFFEC',
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.01)',
          }
        }
      }
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 6,
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#097969',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#023020',
              borderWidth: '2px',
            },
          },
        }
      }
    },

    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }
      }
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          fontFamily: 'Georgia, serif',
          borderRadius: 6,
          boxShadow: '0px 1px 4px rgba(0,0,0,0.05)'
        }
      }
    },

    MuiSnackbar: {
      styleOverrides: {
        root: {
          bottom: '20px',
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        }
      }
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.8rem',
          backgroundColor: '#023020',
        }
      }
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;
