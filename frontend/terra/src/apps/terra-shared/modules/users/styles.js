import { alpha } from '@mui/material';

export const fieldStyles = {
    mb: 1,
    '& .MuiInputLabel-root': {
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'text.secondary',
        '&.Mui-focused': { color: 'primary.main' }
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : '#ffffff',
        '& fieldset': {
            borderColor: (theme) => alpha(theme.palette.divider, 0.6),
            borderWidth: '1.5px'
        },
        '&:hover fieldset': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.5)
        },
        '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
            borderWidth: '2px'
        },
        '& input': { color: 'text.primary' }
    },
    '& .MuiSelect-select': {
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        color: 'text.primary'
    }
};

export const menuItemStyles = {
    fontWeight: 600,
    fontSize: '0.9rem',
    mx: 1,
    my: 0.5,
    borderRadius: '10px',
    color: 'text.primary',
    '&.Mui-selected': {
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        color: 'primary.main',
        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }
    }
};
