import React from 'react';
import { Box, Typography, Paper, Checkbox, alpha } from '@mui/material';

export const PermissionCard = ({ perm, selected, color, onClick }) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 2, borderRadius: '16px', border: '1.5px solid',
            borderColor: selected ? color : 'divider',
            bgcolor: selected ? alpha(color, 0.03) : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s ease',
            '&:hover': { borderColor: selected ? color : alpha('#000', 0.1), transform: 'translateY(-2px)' }
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Checkbox checked={selected} sx={{ p: 0, '&.Mui-checked': { color: color } }} />
            <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: selected ? 'text.primary' : 'text.secondary' }}>{perm.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.2, display: 'block', mt: 0.5 }}>{perm.description}</Typography>
            </Box>
        </Box>
    </Paper>
);
