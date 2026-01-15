import React from 'react';
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material';

const WhatsAppPanel = () => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                height: '700px', // Adjusted height or can be dynamic
                borderRadius: '24px',
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
                position: 'relative',
                bgcolor: 'background.paper'
            }}
        >
            <iframe
                src="/whatsapp-web"
                title="WhatsApp Web"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allow="autoplay; camera; geolocation; microphone; payment; usb; xr-spatial-tracking; clipboard-read; clipboard-write; display-capture; publickey-credentials-get; screen-wake-lock; web-share"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-storage-access-by-user-activation allow-presentation allow-pointer-lock"
            />
            {/* Overlay for loading state if needed */}
        </Paper>
    );
};

export default WhatsAppPanel;
