import React from 'react';
import { Box, Typography, Avatar, useTheme, alpha, ButtonBase } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, User, Stethoscope } from 'lucide-react';

export const DoctorSelector = ({ doctors, selectedDoctorId, onSelect }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Box sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            mb: 2,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 3, bgcolor: alpha(theme.palette.divider, 0.5) }
        }}>
            {doctors.map((doctor) => {
                const isSelected = selectedDoctorId === doctor.id;
                return (
                    <ButtonBase
                        key={doctor.id}
                        onClick={() => onSelect(doctor.id)}
                        sx={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1.5,
                            pl: 1,
                            pr: 2.5,
                            borderRadius: '16px',
                            bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
                            border: `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.05),
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={doctor.avatar}
                                alt={doctor.name}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    border: `2px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                                    boxShadow: isSelected ? theme.shadows[2] : 'none'
                                }}
                            />
                            {isSelected && (
                                <Box sx={{
                                    position: 'absolute', bottom: -2, right: -2,
                                    bgcolor: 'primary.main', borderRadius: '50%',
                                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid ${theme.palette.background.paper}`
                                }}>
                                    <Stethoscope size={10} color="white" />
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSelected ? 'primary.main' : 'text.primary' }}>
                                {doctor.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {t('users.roles.doctor')}
                            </Typography>
                        </Box>
                    </ButtonBase>
                );
            })}
        </Box>
    );
};
