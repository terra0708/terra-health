import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Button,
    IconButton,
    Chip,
    alpha,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Trash2,
    RotateCcw,
    FileText,
    AlertTriangle,
    Inbox
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFileStore } from '@shared/modules/files';
import { useCustomerSettingsStore } from '@terra-health/modules/customers/hooks/useCustomerSettingsStore';
import { useLookup } from '@common/hooks/useLookup';
import { ModulePageWrapper } from '@common/ui';

const TrashPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const fileStore = useFileStore();
    const settings = useCustomerSettingsStore();
    const { getLocalized } = useLookup();

    const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });

    useEffect(() => {
        fileStore.fetchTrashFiles();
        settings.fetchFileCategories();
    }, []);

    const handleRestore = async (file) => {
        try {
            await fileStore.restoreFile(file.customerId, file.id);
        } catch (error) {
            console.error('Failed to restore file:', error);
        }
    };

    const handlePermanentDelete = async () => {
        if (!deleteDialog.file) return;
        try {
            await fileStore.permanentDeleteFile(deleteDialog.file.id);
            setDeleteDialog({ open: false, file: null });
        } catch (error) {
            console.error('Failed to permanently delete file:', error);
        }
    };

    const getCategoryName = (categoryId) => {
        const category = settings.fileCategories.find(c => c.id === categoryId);
        return category ? getLocalized(category) : t('common.unknown', 'Bilinmiyor');
    };

    const getDaysUntilAutoDelete = (deletedAt) => {
        const deleted = new Date(deletedAt);
        const autoDeleteDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysLeft = Math.ceil((autoDeleteDate - now) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 ? daysLeft : 0;
    };

    return (
        <ModulePageWrapper moduleName="Trash" aria-label="Trash Page">
            <Box sx={{ animation: 'fadeIn 0.5s ease', p: 3 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'error.main'
                        }}>
                            <Trash2 size={28} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{
                                fontWeight: 900,
                                letterSpacing: '-0.02em',
                                background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {t('trash.title')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                {t('trash.subtitle')}
                            </Typography>
                        </Box>
                    </Box>

                    {fileStore.trashFiles.length > 0 && (
                        <Alert
                            severity="info"
                            icon={<AlertTriangle size={18} />}
                            sx={{ mt: 2, borderRadius: '16px', fontWeight: 600 }}
                        >
                            {t('trash.auto_delete_info')}
                        </Alert>
                    )}
                </Box>

                {/* File List */}
                {fileStore.loading ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('common.loading')}
                        </Typography>
                    </Box>
                ) : fileStore.trashFiles.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 8,
                            borderRadius: '32px',
                            border: `1px solid ${theme.palette.divider}`,
                            textAlign: 'center'
                        }}
                    >
                        <Inbox size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, opacity: 0.3 }}>
                            {t('trash.empty_trash')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.3 }}>
                            {t('trash.empty_trash_desc')}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {fileStore.trashFiles.map((file) => {
                            const daysLeft = getDaysUntilAutoDelete(file.deletedAt);
                            return (
                                <Paper
                                    key={file.id}
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: '20px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: theme.palette.error.main,
                                            bgcolor: alpha(theme.palette.error.main, 0.02)
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '12px',
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'error.main'
                                    }}>
                                        <FileText size={24} />
                                    </Box>

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 800, mb: 0.5 }}>
                                            {file.displayName}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip
                                                label={getCategoryName(file.categoryId)}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                            />
                                            <Chip
                                                label={file.customerName || t('trash.customer_name')}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                                {t('trash.deleted_at')}: {new Date(file.deletedAt).toLocaleDateString()}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    <Tooltip title={`${daysLeft} ${t('common.days', 'gün')} sonra otomatik silinecek`}>
                                        <Chip
                                            label={`${daysLeft}d`}
                                            size="small"
                                            color={daysLeft < 7 ? 'error' : 'default'}
                                            sx={{ fontWeight: 900 }}
                                        />
                                    </Tooltip>

                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title={t('trash.restore')}>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleRestore(file)}
                                                sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                                }}
                                            >
                                                <RotateCcw size={18} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('trash.permanent_delete')}>
                                            <IconButton
                                                color="error"
                                                onClick={() => setDeleteDialog({ open: true, file })}
                                                sx={{
                                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}

                {/* Permanent Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onClose={() => setDeleteDialog({ open: false, file: null })}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '24px' } }}
                >
                    <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'error.main'
                        }}>
                            <AlertTriangle size={24} />
                        </Box>
                        {t('trash.permanent_delete')}
                    </DialogTitle>
                    <DialogContent>
                        <Alert severity="error" sx={{ borderRadius: '16px', fontWeight: 600, mb: 2 }}>
                            {t('trash.confirm_permanent_delete')}
                        </Alert>
                        {deleteDialog.file && (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                <strong>{deleteDialog.file.displayName}</strong>
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, gap: 1 }}>
                        <Button
                            onClick={() => setDeleteDialog({ open: false, file: null })}
                            variant="outlined"
                            sx={{ borderRadius: '12px', px: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handlePermanentDelete}
                            variant="contained"
                            color="error"
                            sx={{ borderRadius: '12px', px: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                            {t('trash.permanent_delete')}
                        </Button>
                    </DialogActions>
                </Dialog>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </Box>
        </ModulePageWrapper>
    );
};

export default TrashPage;
