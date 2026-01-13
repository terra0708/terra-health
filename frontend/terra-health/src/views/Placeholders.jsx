import { Typography, Paper, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const PlaceholderView = ({ titleKey }) => {
    const { t } = useTranslation();

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
                {t(`menu.${titleKey}`)}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('placeholders.under_development')}
            </Typography>

            <Paper sx={{ p: 4, borderRadius: 4, border: '1px dashed', borderColor: 'divider', bgcolor: 'transparent', textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {t(`menu.${titleKey}`)} {t('placeholders.content_will_be_here')}
                </Typography>
            </Paper>
        </Box>
    );
};

export const Dashboard = () => <PlaceholderView titleKey="dashboard" />;
export const Appointments = () => <PlaceholderView titleKey="appointments" />;
export const Customers = () => <PlaceholderView titleKey="customers" />;
export const Ads = () => <PlaceholderView titleKey="ads" />;
export const Statistics = () => <PlaceholderView titleKey="statistics" />;
export const Notifications = () => <PlaceholderView titleKey="notifications" />;
export const Settings = () => <PlaceholderView titleKey="settings" />;
