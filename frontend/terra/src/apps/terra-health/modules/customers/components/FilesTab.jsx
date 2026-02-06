import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Stack, Box, Typography, Tabs, Tab, Button, Chip, Paper, IconButton,
    TextField, alpha, useTheme, Menu, MenuItem, Dialog, DialogTitle,
    DialogContent, DialogActions, LinearProgress, Tooltip, Divider
} from '@mui/material';
import {
    Upload, FileText, Trash2, ChevronRight, CheckCircle2, Download,
    MoreVertical, Edit2, FolderOpen, Loader
} from 'lucide-react';
import { useLookup } from '@common/hooks/useLookup';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useFileStore } from '@shared/modules/files';

export const FilesTab = ({ customerId, t, pendingFiles, setPendingFiles }) => {
    const theme = useTheme();
    const settings = useCustomerSettingsStore();
    const fileStore = useFileStore();
    const { getLocalized } = useLookup();
    const fileInputRef = useRef(null);

    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editDialog, setEditDialog] = useState({ open: false, file: null, newName: '', newCategoryId: null });

    // Fetch files when component mounts or customerId changes
    useEffect(() => {
        if (customerId) {
            fileStore.fetchCustomerFiles(customerId);
        }
    }, [customerId]);

    // Set default category when categories load
    useEffect(() => {
        if (settings.fileCategories.length > 0 && !selectedCategoryId) {
            setSelectedCategoryId(settings.fileCategories[0].id);
        }
    }, [settings.fileCategories, selectedCategoryId]);

    // Get current category
    const currentCategory = useMemo(() => {
        return settings.fileCategories.find(c => c.id === selectedCategoryId);
    }, [settings.fileCategories, selectedCategoryId]);

    // Filter files by category
    const filesByCategory = useMemo(() => {
        const grouped = {};
        settings.fileCategories.forEach(cat => {
            grouped[cat.id] = fileStore.files.filter(f => f.categoryId === cat.id && !f.isDeleted);
        });
        return grouped;
    }, [fileStore.files, settings.fileCategories]);

    // All files (for "All Files" tab)
    const allFiles = useMemo(() => {
        return fileStore.files.filter(f => !f.isDeleted);
    }, [fileStore.files]);

    const handleFileSelection = (files) => {
        const selected = Array.from(files).map(f => {
            const lastDotIndex = f.name.lastIndexOf('.');
            const name = lastDotIndex !== -1 ? f.name.substring(0, lastDotIndex) : f.name;
            const extension = lastDotIndex !== -1 ? f.name.substring(lastDotIndex + 1) : '';

            return {
                id: Math.random().toString(36).substr(2, 9),
                file: f,
                displayName: name,
                extension: extension,
                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                categoryId: selectedCategoryId
            };
        });
        setPendingFiles(prev => [...prev, ...selected]);
    };


    const handleFileMenu = (event, file) => {
        setAnchorEl(event.currentTarget);
        setSelectedFile(file);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedFile(null);
    };

    const handleDownload = async () => {
        if (!selectedFile || !customerId) return;
        try {
            await fileStore.downloadFile(customerId, selectedFile.id, selectedFile.displayName);
        } catch (error) {
            console.error('Failed to download file:', error);
        }
        handleCloseMenu();
    };

    const handleDelete = async () => {
        if (!selectedFile || !customerId) return;
        try {
            await fileStore.deleteFile(customerId, selectedFile.id);
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
        handleCloseMenu();
    };

    const handleEditOpen = () => {
        if (!selectedFile) return;
        setEditDialog({
            open: true,
            file: selectedFile,
            newName: selectedFile.displayName,
            newCategoryId: selectedFile.categoryId
        });
        handleCloseMenu();
    };

    const handleEditSave = async () => {
        if (!editDialog.file || !customerId) return;
        try {
            await fileStore.updateFile(customerId, editDialog.file.id, {
                displayName: editDialog.newName,
                categoryId: editDialog.newCategoryId
            });
            setEditDialog({ open: false, file: null, newName: '', newCategoryId: null });
        } catch (error) {
            console.error('Failed to update file:', error);
        }
    };

    const renderFileCard = (file) => (
        <Paper
            key={file.id}
            elevation={0}
            sx={{
                p: 2,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                }
            }}
        >
            <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main'
            }}>
                <FileText size={20} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {file.fileSize} • {new Date(file.createdAt).toLocaleDateString()}
                </Typography>
            </Box>
            <IconButton size="small" onClick={(e) => handleFileMenu(e, file)}>
                <MoreVertical size={18} />
            </IconButton>
        </Paper>
    );

    return (
        <Stack spacing={4}>
            {/* Category Tabs */}
            <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={selectedCategoryId || false}
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={(e, newValue) => setSelectedCategoryId(newValue)}
                >
                    <Tab
                        value="all"
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FolderOpen size={16} />
                                <span>{t('customers.all_files', 'Tüm Dosyalar')}</span>
                                <Chip label={allFiles.length} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                            </Box>
                        }
                    />
                    {settings.fileCategories.map((cat) => (
                        <Tab
                            key={cat.id}
                            value={cat.id}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getLocalized(cat)}
                                    <Chip label={filesByCategory[cat.id]?.length || 0} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                                </Box>
                            }
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Upload Area (only show when specific category selected) */}
            {selectedCategoryId && selectedCategoryId !== 'all' && (
                <Box
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files) handleFileSelection(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                        p: 4,
                        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: '32px',
                        textAlign: 'center',
                        bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.01),
                        cursor: 'pointer',
                        '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' },
                        transition: 'all 0.3s'
                    }}
                >
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                    />
                    <Upload size={32} style={{ marginBottom: 12, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                        {t('customers.drawer.click_to_select')}
                    </Typography>
                    <Chip
                        label={currentCategory ? getLocalized(currentCategory) : ''}
                        size="small"
                        sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
                    />
                </Box>
            )}

            {/* Pending Files (Upload Queue) */}
            {pendingFiles.length > 0 && (
                <Stack spacing={2} sx={{
                    p: 3,
                    borderRadius: '24px',
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${theme.palette.primary.light}`
                }}>
                    {pendingFiles.map((pf) => (
                        <Paper key={pf.id} elevation={0} sx={{ p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="standard"
                                    value={pf.displayName}
                                    onChange={(e) => setPendingFiles(prev => prev.map(f => f.id === pf.id ? { ...f, displayName: e.target.value } : f))}
                                    helperText={`.${pf.extension} | ${pf.size}`}
                                />
                            </Box>
                            <IconButton
                                color="error"
                                onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== pf.id))}
                            >
                                <Trash2 size={16} />
                            </IconButton>
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Upload Progress */}
            {fileStore.uploadQueue.length > 0 && (
                <Stack spacing={1}>
                    {fileStore.uploadQueue.map((upload) => (
                        <Paper key={upload.id} elevation={0} sx={{ p: 2, borderRadius: '12px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Loader size={16} className="animate-spin" />
                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                                    {upload.displayName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {upload.progress}%
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={upload.progress} sx={{ borderRadius: 1 }} />
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* File List */}
            <Box>
                {selectedCategoryId === 'all' ? (
                    // All Files View
                    <Stack spacing={2}>
                        {settings.fileCategories.map(cat => {
                            const categoryFiles = filesByCategory[cat.id] || [];
                            if (categoryFiles.length === 0) return null;
                            return (
                                <Box key={cat.id}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: 900,
                                            color: 'text.secondary',
                                            textTransform: 'uppercase',
                                            mb: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}
                                    >
                                        <ChevronRight size={14} /> {getLocalized(cat)}
                                    </Typography>
                                    <Stack spacing={1}>
                                        {categoryFiles.map(file => renderFileCard(file))}
                                    </Stack>
                                </Box>
                            );
                        })}
                        {allFiles.length === 0 && (
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                <FileText size={48} style={{ marginBottom: 16 }} />
                                <Typography variant="body2" fontWeight={800}>
                                    {t('customers.no_files')}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                ) : (
                    // Category-specific View
                    <Stack spacing={1}>
                        {(filesByCategory[selectedCategoryId] || []).map(file => renderFileCard(file))}
                        {(!filesByCategory[selectedCategoryId] || filesByCategory[selectedCategoryId].length === 0) && (
                            <Box sx={{ py: 8, textAlign: 'center', opacity: 0.3 }}>
                                <FileText size={48} style={{ marginBottom: 16 }} />
                                <Typography variant="body2" fontWeight={800}>
                                    {t('customers.no_files')}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                )}
            </Box>

            {/* File Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: 180 } }}
            >
                <MenuItem onClick={handleDownload}>
                    <Download size={16} style={{ marginRight: 8 }} />
                    {t('common.download', 'İndir')}
                </MenuItem>
            </Menu>

            {/* Edit File Dialog */}
            <Dialog
                open={editDialog.open}
                onClose={() => setEditDialog({ open: false, file: null, newName: '', newCategoryId: null })}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>
                    {t('files.edit_file', 'Dosyayı Düzenle')}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label={t('files.file_name', 'Dosya Adı')}
                            value={editDialog.newName}
                            onChange={(e) => setEditDialog(prev => ({ ...prev, newName: e.target.value }))}
                        />
                        <TextField
                            fullWidth
                            select
                            label={t('customers.file_category', 'Dosya Kategorisi')}
                            value={editDialog.newCategoryId || ''}
                            onChange={(e) => setEditDialog(prev => ({ ...prev, newCategoryId: e.target.value }))}
                        >
                            {settings.fileCategories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {getLocalized(cat)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setEditDialog({ open: false, file: null, newName: '', newCategoryId: null })}
                        sx={{ borderRadius: '12px' }}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEditSave}
                        sx={{ borderRadius: '12px' }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};
