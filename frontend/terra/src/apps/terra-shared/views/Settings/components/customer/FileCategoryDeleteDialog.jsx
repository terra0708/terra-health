import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    MenuItem,
    TextField,
    alpha,
    useTheme
} from '@mui/material';
import { AlertTriangle, FolderInput } from 'lucide-react';

/**
 * FileCategoryDeleteDialog
 * 
 * Smart delete dialog for file categories.
 * If category has files, forces user to migrate them to another category.
 */
export const FileCategoryDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    category,
    fileCount,
    availableCategories,
    getDisplayName,
    t
}) => {
    const theme = useTheme();
    const [targetCategoryId, setTargetCategoryId] = useState('');

    const handleConfirm = () => {
        if (fileCount > 0 && !targetCategoryId) {
            return; // Prevent deletion without migration
        }
        onConfirm(targetCategoryId);
        setTargetCategoryId('');
    };

    const handleClose = () => {
        setTargetCategoryId('');
        onClose();
    };

    if (!category) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{
                fontWeight: 900,
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
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
                {t('files.delete_category', 'Kategoriyi Sil')}
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 600 }}>
                    <strong>"{getDisplayName(category)}"</strong> kategorisini silmek üzeresiniz.
                </Typography>

                {fileCount > 0 ? (
                    <>
                        <Alert
                            severity="warning"
                            icon={<FolderInput size={20} />}
                            sx={{
                                mb: 3,
                                borderRadius: '16px',
                                fontWeight: 600,
                                '& .MuiAlert-message': { width: '100%' }
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                                ⚠️ Bu kategoride <strong>{fileCount} dosya</strong> var!
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                                Silmeden önce bu dosyaları başka bir kategoriye taşımalısınız.
                            </Typography>
                        </Alert>

                        <TextField
                            fullWidth
                            select
                            label={t('files.migrate_to_category', 'Dosyalar Nereye Taşınsın?')}
                            value={targetCategoryId}
                            onChange={(e) => setTargetCategoryId(e.target.value)}
                            required
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '14px'
                                }
                            }}
                        >
                            {availableCategories
                                .filter(cat => cat.id !== category.id)
                                .map((cat) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {getDisplayName(cat)}
                                    </MenuItem>
                                ))}
                        </TextField>
                    </>
                ) : (
                    <Alert
                        severity="info"
                        sx={{
                            borderRadius: '16px',
                            fontWeight: 600
                        }}
                    >
                        {t('files.no_files_safe_delete', 'Bu kategoride dosya yok, güvenle silebilirsiniz.')}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none'
                    }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="error"
                    disabled={fileCount > 0 && !targetCategoryId}
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none'
                    }}
                >
                    {fileCount > 0
                        ? t('files.migrate_and_delete', 'Taşı ve Sil')
                        : t('common.delete', 'Sil')
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};
