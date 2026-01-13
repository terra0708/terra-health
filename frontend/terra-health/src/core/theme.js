import { createTheme } from '@mui/material/styles';

/**
 * Terra-Health Wired Gradient Teması
 * Lordicon Wired Gradient renk paletine (Mor & Cyan) birebir uyumlu.
 */
export const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: '#a259ff', // Canlı Mor
            light: '#c38fff',
            dark: '#7e22ce',
        },
        secondary: {
            main: '#00d2ff', // Canlı Cam Göbeği / Mavi
        },
        background: {
            default: mode === 'light' ? '#fcfaff' : '#0a0a0c', // Hafif morumsu arka plan
            paper: mode === 'light' ? '#ffffff' : '#14141a',
        },
        text: {
            primary: mode === 'light' ? '#1a1a1f' : '#f0f0f5',
            secondary: mode === 'light' ? '#6e6e77' : '#9ca3af',
        },
        divider: mode === 'light' ? 'rgba(162, 89, 255, 0.08)' : 'rgba(162, 89, 255, 0.15)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 900,
            letterSpacing: '-0.04em',
        },
        button: {
            textTransform: 'none',
            fontWeight: 700,
            letterSpacing: '0.01em',
        },
    },
    shape: {
        borderRadius: 14,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 20px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(162, 89, 255, 0.3)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: mode === 'light'
                        ? '0 10px 40px rgba(0,0,0,0.03)'
                        : '0 10px 40px rgba(0,0,0,0.2)',
                },
            },
        },
    },
});
