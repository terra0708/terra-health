import React, { useState, useRef, useEffect } from 'react';
import { Stack, Box, Typography, Tabs, Tab, Button, Chip, Paper, IconButton, TextField, alpha, useTheme } from '@mui/material';
import { Upload, FileText, Trash2, ChevronRight, CheckCircle2, Filter } from 'lucide-react';
import { useLookup } from '@common/hooks/useLookup';
import { useCustomerSettingsStore } from '../hooks/useCustomerSettingsStore';
import { useController } from 'react-hook-form';

export const FilesTab = ({ control, t }) => {
    const theme = useTheme();
    const settings = useCustomerSettingsStore();
    const { getLocalized } = useLookup();
    const fileInputRef = useRef(null);
    const { field: filesField } = useController({ name: 'files', control });

    const [selectedCategory, setSelectedCategory] = useState('');
    const [pendingFiles, setPendingFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (settings.fileCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(settings.fileCategories[0].label_tr);
        }
    }, [settings.fileCategories, selectedCategory]);

    const handleFileSelection = (files) => {
        const selected = Array.from(files).map(f => {
            const lastDotIndex = f.name.lastIndexOf('.');
            const name = lastDotIndex !== -1 ? f.name.substring(0, lastDotIndex) : f.name;
            const extension = lastDotIndex !== -1 ? f.name.substring(lastDotIndex + 1) : '';

            return {
                id: Math.random().toString(36).substr(2, 9),
                displayName: name,
                extension: extension,
                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                category: selectedCategory,
                date: new Date().toLocaleDateString()
            };
        });
        setPendingFiles(prev => [...prev, ...selected]);
    };

    const confirmUpload = () => {
        const newFiles = pendingFiles.map(pf => ({
            id: Date.now() + Math.random(),
            name: pf.displayName + (pf.extension ? '.' + pf.extension : ''),
            size: pf.size,
            category: pf.category,
            date: pf.date
        }));
        filesField.onChange([...newFiles, ...filesField.value]);
        setPendingFiles([]);
    };

    return (
        <Stack spacing={4}>
            <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={settings.fileCategories.findIndex(c => c.label_tr === selectedCategory)}
                    variant="scrollable" scrollButtons="auto"
                    onChange={(e, v) => setSelectedCategory(settings.fileCategories[v].label_tr)}
                >
                    {settings.fileCategories.map((cat) => <Tab key={cat.id} label={getLocalized(cat)} />)}
                </Tabs>
            </Box>

            <Box
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFileSelection(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    p: 4, border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`, borderRadius: '32px', textAlign: 'center',
                    bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.01), cursor: 'pointer',
                    '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' }, transition: 'all 0.3s'
                }}
            >
                <input type="file" multiple hidden ref={fileInputRef} onChange={(e) => e.target.files && handleFileSelection(e.target.files)} />
                <Upload size={32} style={{ marginBottom: 12, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>{t('customers.drawer.click_to_select')}</Typography>
                <Chip label={selectedCategory} size="small" sx={{ fontWeight: 900, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
            </Box>

            {pendingFiles.length > 0 && (
                <Stack spacing={2} sx={{ p: 3, borderRadius: '24px', bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${theme.palette.primary.light}` }}>
                    {pendingFiles.map((pf) => (
                        <Paper key={pf.id} elevation={0} sx={{ p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    fullWidth size="small" variant="standard"
                                    value={pf.displayName}
                                    onChange={(e) => setPendingFiles(prev => prev.map(f => f.id === pf.id ? { ...f, displayName: e.target.value } : f))}
                                    helperText={`.${pf.extension} | ${pf.size}`}
                                />
                            </Box>
                            <IconButton color="error" onClick={() => setPendingFiles(prev => prev.filter(f => f.id !== pf.id))}><Trash2 size={16} /></IconButton>
                        </Paper>
                    ))}
                    <Button variant="contained" fullWidth onClick={confirmUpload} startIcon={<CheckCircle2 size={18} />}>
                        {t('customers.drawer.add_multiple_to_system', { count: pendingFiles.length })}
                    </Button>
                </Stack>
            )}

            <Box>
                {settings.fileCategories.map(cat => {
                    const categoryFiles = filesField.value.filter(f => f.category === cat.label_tr);
                    if (categoryFiles.length === 0) return null;
                    return (
                        <Box key={cat.id} sx={{ mb: 3 }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ChevronRight size={14} /> {getLocalized(cat)}
                            </Typography>
                            <Stack spacing={1}>
                                {categoryFiles.map((file) => (
                                    <Paper key={file.id} elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <FileText size={20} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</Typography>
                                            <Typography variant="caption">{file.size} • {file.date}</Typography>
                                        </Box>
                                        <IconButton size="small" color="error" onClick={() => filesField.onChange(filesField.value.filter(f => f.id !== file.id))}><Trash2 size={16} /></IconButton>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>
        </Stack>
    );
};
