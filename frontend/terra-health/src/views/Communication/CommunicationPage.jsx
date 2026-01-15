import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import WhatsAppPanel from './WhatsAppPanel';

const CommunicationPage = () => {
    const { t } = useTranslation();

    return (
        <Box sx={{ animation: 'fadeIn 0.6s ease', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
                    {t('menu.communication')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    WhatsApp Web entegrasyonu ile tüm mesajlarınızı buradan yönetin.
                </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <WhatsAppPanel />
            </Box>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Box>
    );
};

export default CommunicationPage;
