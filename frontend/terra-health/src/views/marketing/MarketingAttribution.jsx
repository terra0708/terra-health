import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    useTheme,
    Tooltip,
    IconButton,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Chip,
    Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, Hash, Search, MessageCircle, UserCircle, Smartphone, Globe } from 'lucide-react';
import { MOCK_ATTRIBUTION_DATA_FULL } from '../../mocks/marketingMocks';

const AttributionCard = ({ label, value, icon: Icon, color }) => (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, bgcolor: alpha(color, 0.03), borderColor: alpha(color, 0.1) }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: color, color: 'white', display: 'flex' }}>
                <Icon size={20} />
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    </Paper>
);

const MarketingAttribution = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredData = (MOCK_ATTRIBUTION_DATA_FULL || []).filter(item =>
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.campaign || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.country || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSourceIcon = (source) => {
        switch (source) {
            case 'meta': return <Smartphone size={16} />;
            case 'google': return <Globe size={16} />;
            case 'whatsapp': return <MessageCircle size={16} />;
            case 'manual': return <UserCircle size={16} />;
            default: return <Globe size={16} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sale': return 'success';
            case 'cancelled': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={900} sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Lead Attribution Trace
                </Typography>
                <Typography color="text.secondary" variant="body1">
                    Connecting every conversion to its marketing origin and click data
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <AttributionCard label="Primary Channel" value="Meta Ads (52%)" icon={Smartphone} color={theme.palette.primary.main} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <AttributionCard label="Best Campaign" value="Hair Transplant DE" icon={Hash} color={theme.palette.success.main} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <AttributionCard label="Avg. Conversion Value" value="€4,250" icon={ExternalLink} color={theme.palette.warning.main} />
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        fullWidth
                        placeholder="Search by Lead Name, Campaign or Country..."
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
                </Stack>
            </Card>

            <TableContainer component={Card} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: theme => theme.palette.mode === 'light' ? 'grey.50' : 'background.default' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Lead Identity</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Platform Source</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Conversion Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Campaign Origin</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Acquisition Date</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>Tracker</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow key={item.id} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 900, fontSize: '0.9rem' }}>
                                            {item.name ? item.name[0] : '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={800}>
                                                {item.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {item.country}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{getSourceIcon(item.platform)}</Box>
                                        <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                            {item.platform}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.status.toUpperCase()}
                                        size="small"
                                        color={getStatusColor(item.status)}
                                        variant="soft"
                                        sx={{ fontWeight: 900, fontSize: '0.65rem', borderRadius: 1.5 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {item.campaign || 'N/A'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        {item.date}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View Tracker Details">
                                        <IconButton size="small" color="primary">
                                            <ExternalLink size={16} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MarketingAttribution;
