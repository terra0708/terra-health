import React, { useState, useRef } from 'react';
import {
    Drawer, Box, Typography, TextField, Button, IconButton, Stack,
    Tabs, Tab, alpha, useTheme, Divider, Paper, Chip, Tooltip
} from '@mui/material';
import {
    X, Send, MessageCircle, Mail, Paperclip, Image as ImageIcon,
    FileText, Trash2, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CustomerCommunicationDrawer = ({ open, onClose, customer }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0); // 0: WhatsApp, 1: Email
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);

    // WhatsApp State
    const [wsMessage, setWsMessage] = useState('');
    const [wsFiles, setWsFiles] = useState([]);

    // Email State
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    if (!customer) return null;

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            name: f.name,
            size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
            type: f.type
        }));
        setWsFiles(prev => [...prev, ...files]);
    };

    const removeFile = (id) => {
        setWsFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleSendWhatsApp = () => {
        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            setWsMessage('');
            setWsFiles([]);
            onClose();
        }, 1500);
    };

    const handleSendEmail = () => {
        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            setEmailSubject('');
            setEmailBody('');
            onClose();
        }, 1500);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                zIndex: theme.zIndex.drawer + 5, // Higher than header and other drawers
                '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)', bgcolor: alpha(theme.palette.common.black, 0.4) }
            }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 500 },
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha(theme.palette.primary.main, 0.02)
            }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('customers.communication') || 'İletişim'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {customer.name} ({customer.phone || customer.email})
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                    <X size={20} />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            py: 2,
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            textTransform: 'none',
                            gap: 1
                        }
                    }}
                >
                    <Tab icon={<MessageCircle size={18} />} iconPosition="start" label="WhatsApp" />
                    <Tab icon={<Mail size={18} />} iconPosition="start" label="E-Posta" />
                </Tabs>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                {tabValue === 0 ? (
                    /* WHATSAPP PANEL */
                    <Stack spacing={3}>
                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha('#25D366', 0.05), border: `1px solid ${alpha('#25D366', 0.1)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#25D366' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#25D366' }}>
                                    WhatsApp Hattı Aktif
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 500 }}>
                                Mesajınız Evolution API üzerinden iletilecektir.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Mesaj İçeriği</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                placeholder="Mesajınızı buraya yazın..."
                                value={wsMessage}
                                onChange={(e) => setWsMessage(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        bgcolor: 'background.paper'
                                    }
                                }}
                            />
                        </Box>

                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Dosya & Resim Ekle</Typography>
                                <Button
                                    size="small"
                                    startIcon={<Paperclip size={16} />}
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                                >
                                    Dosya Seç
                                </Button>
                            </Box>
                            <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileSelect} />

                            {wsFiles.length > 0 ? (
                                <Stack spacing={1}>
                                    {wsFiles.map((f) => (
                                        <Paper
                                            key={f.id}
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '12px',
                                                border: `1px solid ${theme.palette.divider}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5
                                            }}
                                        >
                                            {f.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {f.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{f.size}</Typography>
                                            </Box>
                                            <IconButton size="small" color="error" onClick={() => removeFile(f.id)}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Box sx={{
                                    p: 3,
                                    border: `2px dashed ${theme.palette.divider}`,
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    bgcolor: alpha(theme.palette.primary.main, 0.005)
                                }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Henüz dosya eklenmedi (Opsiyonel)
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={!wsMessage.trim() || sending}
                            startIcon={<Send size={18} />}
                            onClick={handleSendWhatsApp}
                            sx={{
                                borderRadius: '16px',
                                py: 1.5,
                                fontWeight: 900,
                                bgcolor: '#25D366',
                                '&:hover': { bgcolor: '#128C7E' }
                            }}
                        >
                            {sending ? 'Gönderiliyor...' : 'WhatsApp Mesajı Gönder'}
                        </Button>
                    </Stack>
                ) : (
                    /* EMAIL PANEL */
                    <Stack spacing={3}>
                        <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Mail size={18} color={theme.palette.primary.main} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    Kurumsal E-Posta
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 500 }}>
                                Mailleriniz Amazon SES altyapısı ile güvenle iletilir.
                            </Typography>
                        </Box>

                        <TextField
                            fullWidth
                            label="E-Posta Konusu"
                            placeholder="Konu başlığını yazın..."
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            InputProps={{
                                sx: { borderRadius: '12px' }
                            }}
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>E-Posta İçeriği</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={10}
                                placeholder="E-posta içeriğini buraya yazın..."
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                        bgcolor: 'background.paper'
                                    }
                                }}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={!emailSubject.trim() || !emailBody.trim() || sending}
                            startIcon={<Send size={18} />}
                            onClick={handleSendEmail}
                            sx={{
                                borderRadius: '16px',
                                py: 1.5,
                                fontWeight: 900,
                                bgcolor: theme.palette.primary.main
                            }}
                        >
                            {sending ? 'Gönderiliyor...' : 'E-Posta Gönder'}
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Footer / Status */}
            <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.divider, 0.1) }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <AlertCircle size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Tüm iletişim trafiği müşteri geçmişine kaydedilir.
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
};
