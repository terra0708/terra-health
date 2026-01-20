import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Avatar,
    alpha,
    useTheme
} from '@mui/material';
import { User, Phone, Mail, Globe } from 'lucide-react';

/**
 * Generic Client Card Component
 * 
 * Base client bilgilerini gösterir. Modül bağımsızdır.
 * Health-specific detaylar için PatientCard gibi modül-specific component'ler kullanılmalı.
 */
export const ClientCard = ({ client, onClick, compact = false }) => {
    const theme = useTheme();

    if (!client) return null;

    const getSourceColor = (source) => {
        const colors = {
            'google_ads': '#4285F4',
            'meta_ads': '#1877F2',
            'instagram_ads': '#E4405F',
            'manual': '#6B7280',
            'referral': '#8B5CF6'
        };
        return colors[source] || theme.palette.primary.main;
    };

    const getSourceLabel = (source) => {
        const labels = {
            'google_ads': 'Google Ads',
            'meta_ads': 'Meta Ads',
            'instagram_ads': 'Instagram Ads',
            'manual': 'Manuel',
            'referral': 'Tavsiye'
        };
        return labels[source] || source;
    };

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: compact ? 2 : 2.5,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
                    borderColor: theme.palette.primary.main
                } : {}
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                    sx={{
                        width: compact ? 40 : 48,
                        height: compact ? 40 : 48,
                        bgcolor: theme.palette.primary.main,
                        fontSize: compact ? '1rem' : '1.2rem',
                        fontWeight: 700
                    }}
                >
                    {client.name?.charAt(0)?.toUpperCase() || '?'}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant={compact ? "subtitle2" : "h6"}
                        sx={{
                            fontWeight: 700,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {client.name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                        {client.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <Phone size={14} />
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    {client.phone}
                                </Typography>
                            </Box>
                        )}
                        {client.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <Mail size={14} />
                                <Typography variant="caption" sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {client.email}
                                </Typography>
                            </Box>
                        )}
                        {client.country && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <Globe size={14} />
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    {client.country}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {client.source && (
                            <Chip
                                label={getSourceLabel(client.source)}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: alpha(getSourceColor(client.source), 0.1),
                                    color: getSourceColor(client.source),
                                    border: `1px solid ${alpha(getSourceColor(client.source), 0.2)}`
                                }}
                            />
                        )}
                        {client.industryType && (
                            <Chip
                                label={client.industryType}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: alpha(theme.palette.info.main, 0.1),
                                    color: theme.palette.info.main
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};
