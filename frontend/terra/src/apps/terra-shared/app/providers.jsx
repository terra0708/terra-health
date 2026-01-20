import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { getTheme } from '@core';
import useSettingsStore from '@core/useSettingsStore';
import { useMemo } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // date-fns v3/v4 support
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export const AppProviders = ({ children }) => {
    const mode = useSettingsStore((state) => state.mode);
    const theme = useMemo(() => getTheme(mode), [mode]);
    const { i18n } = useTranslation();

    const localeMap = {
        tr: tr,
        en: enUS
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={localeMap[i18n.language] || enUS}>
                    <BrowserRouter>
                        {children}
                    </BrowserRouter>
                </LocalizationProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};
