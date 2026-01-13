import { Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { Sun, Moon, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@core';
import { useState } from 'react';

/**
 * Tema (Dark/Light) ve Dil değiştirme butonlarını barındıran animasyonlu bileşen.
 * Dil değiştirme işlemi artık sadece ikon içeren bir buton üzerinden yapılıyor.
 */
const SettingsSwitchers = ({ sx = {} }) => {
    const { i18n, t } = useTranslation();
    const { mode, toggleMode, setLanguage } = useSettingsStore();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (lang) => {
        setAnchorEl(null);
        if (lang && (lang === 'tr' || lang === 'en')) {
            i18n.changeLanguage(lang);
            setLanguage(lang);
        }
    };

    const languages = [
        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
    ];

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
            {/* Dil Seçici (Sadece İkon) */}
            <Tooltip title={t('common.change_language')}>
                <IconButton
                    id="language-button"
                    aria-controls={open ? 'language-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                    color="inherit"
                    sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: (theme) => mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)' }
                    }}
                >
                    <Languages size={20} />
                </IconButton>
            </Tooltip>

            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
                MenuListProps={{
                    'aria-labelledby': 'language-button',
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        mt: 1,
                        minWidth: 140,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: mode => `1px solid ${mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`
                    }
                }}
            >
                {languages.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleClose(lang.code)}
                        selected={i18n.language === lang.code}
                        sx={{
                            gap: 1.5,
                            py: 1,
                            fontSize: '0.9rem',
                            fontWeight: i18n.language === lang.code ? 700 : 500
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                        {lang.label}
                    </MenuItem>
                ))}
            </Menu>

            {/* Tema Switcher */}
            <Tooltip title={mode === 'light' ? t('common.dark_mode') : t('common.light_mode')}>
                <IconButton
                    onClick={toggleMode}
                    color="inherit"
                    sx={{
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'rotate(15deg) scale(1.1)',
                            bgcolor: (theme) => mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
                        },
                    }}
                >
                    {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default SettingsSwitchers;
