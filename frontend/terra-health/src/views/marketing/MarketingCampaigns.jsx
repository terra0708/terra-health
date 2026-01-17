import React from 'react';
import {
    Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, LinearProgress, Stack, useTheme, Avatar, TextField, InputAdornment,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl,
    InputLabel, Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
    ExternalLink, Play, Pause, MoreVertical, Search, Plus, Filter, BarChart2
} from 'lucide-react';
import { useMarketingCampaigns, getPlatformIcon, getPlatformColor } from '../../modules/marketing';

const MarketingCampaigns = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const {
        searchQuery, setSearchQuery,
        platformFilter, setPlatformFilter,
        campaigns,
        dialogOpen, setDialogOpen,
        toggleStatus,
        handleViewStats
    } = useMarketingCampaigns();

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {t('ads.campaigns')}
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                        {t('ads.campaigns_subtitle', 'Detailed performance and management of your marketing campaigns')}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                        borderRadius: 3,
                        px: 3,
                        py: 1.5,
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    {t('common.add_new')}
                </Button>
            </Box>

            {/* Filter Bar */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        fullWidth
                        placeholder={t('common.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3 }
                        }}
                    />

                    <FormControl sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }}>
                        <Select
                            value={platformFilter}
                            onChange={(e) => setPlatformFilter(e.target.value)}
                            sx={{ borderRadius: 3 }}
                            startAdornment={
                                <InputAdornment position="start">
                                    <Filter size={18} />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="all">{t('common.all')}</MenuItem>
                            <MenuItem value="meta">Meta Ads</MenuItem>
                            <MenuItem value="google">Google Ads</MenuItem>
                            <MenuItem value="whatsapp">WhatsApp</MenuItem>
                            <MenuItem value="manual">{t('customers.source_manual')}</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Card>

            <TableContainer component={Card} sx={{ borderRadius: 4, overflow: 'visible' }}>
                <Table>
                    <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.platform')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.campaign_name')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.status')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.budget')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.spend')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.leads')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.sales')}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{t('ads.roi')}</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {campaigns.map((campaign) => {
                            const Icon = getPlatformIcon(campaign.platform);
                            const color = getPlatformColor(campaign.platform, theme);
                            return (
                                <TableRow key={campaign.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Tooltip title={campaign.platform.toUpperCase()} arrow>
                                            <Avatar
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor: alpha(color, 0.1),
                                                    color: color,
                                                    border: `1.5px solid ${color}`
                                                }}
                                            >
                                                <Icon size={16} />
                                            </Avatar>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700}>
                                            {campaign.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ID: {campaign.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            icon={campaign.status === 'active' ? <Play size={14} /> : <Pause size={14} />}
                                            label={campaign.status === 'active' ? t('ads.active') : t('ads.paused')}
                                            color={campaign.status === 'active' ? 'success' : 'default'}
                                            variant="soft"
                                            onClick={() => toggleStatus(campaign.id)}
                                            sx={{ fontWeight: 700, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            €{campaign.budget.toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ width: 100 }}>
                                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="caption" fontWeight={700}>€{campaign.spend.toLocaleString()}</Typography>
                                                <Typography variant="caption" color="text.secondary">{Math.round((campaign.spend / campaign.budget) * 100)}%</Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={(campaign.spend / campaign.budget) * 100}
                                                sx={{ borderRadius: 1, height: 6 }}
                                                color={(campaign.spend / campaign.budget) > 0.9 ? 'error' : 'primary'}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700}>
                                            {campaign.leads}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                            {campaign.sales}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {Math.round((campaign.sales / campaign.leads) * 100)}% Conv.
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={800} sx={{ color: campaign.roi > 5 ? 'success.main' : 'warning.main' }}>
                                            {campaign.roi}x
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title={t('ads.view_details', 'View Detailed Stats')}>
                                                <IconButton size="small" color="primary" onClick={() => handleViewStats(campaign.id)} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                                    <BarChart2 size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" color="primary">
                                                <ExternalLink size={18} />
                                            </IconButton>
                                            <IconButton size="small">
                                                <MoreVertical size={18} />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Campaign Dialog (Mock) */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: 5, p: 2 } }}>
                <DialogTitle sx={{ fontWeight: 900 }}>{t('ads.create_campaign', 'Create New Campaign')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1, minWidth: 400 }}>
                        <TextField fullWidth label={t('ads.campaign_name')} placeholder="e.g. Hair Transplant DE" />
                        <FormControl fullWidth>
                            <InputLabel>{t('ads.platform')}</InputLabel>
                            <Select label={t('ads.platform')} defaultValue="meta">
                                <MenuItem value="meta">Meta Ads</MenuItem>
                                <MenuItem value="google">Google Ads</MenuItem>
                                <MenuItem value="whatsapp">WhatsApp Business</MenuItem>
                                <MenuItem value="manual">{t('customers.source_manual')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth label={t('ads.initial_budget', 'Initial Budget')} type="number" InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }} />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary' }}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={() => setDialogOpen(false)}
                        sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}
                    >
                        {t('ads.create_campaign', 'Create Campaign')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MarketingCampaigns;
