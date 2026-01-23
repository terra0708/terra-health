import React from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * Error Boundary Component
 * 
 * React Error Boundary sınıfı - component tree'deki hataları yakalar
 * Modüler yapıya uygun - her modül kendi error boundary'sini kullanabilir
 */
class ErrorBoundaryClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // In production, you could log to an error reporting service
        // Example: logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        });
    };

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback, level = 'page', moduleName } = this.props;
            
            // Custom fallback component
            if (Fallback) {
                return (
                    <Fallback 
                        error={this.state.error} 
                        errorInfo={this.state.errorInfo}
                        resetError={this.handleReset}
                        moduleName={moduleName}
                    />
                );
            }

            // Default fallback UI
            return (
                <ErrorFallback 
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    level={level}
                    moduleName={moduleName}
                    onReset={this.handleReset}
                />
            );
        }

        return this.props.children;
    }
}

/**
 * Error Fallback UI Component
 */
const ErrorFallback = ({ error, errorInfo, level = 'page', moduleName, onReset }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isPageLevel = level === 'page';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: isPageLevel ? '100vh' : '400px',
                p: 3,
                bgcolor: 'background.default'
            }}
            role="alert"
            aria-live="assertive"
        >
            <Paper
                elevation={0}
                sx={{
                    maxWidth: 600,
                    width: '100%',
                    p: 4,
                    borderRadius: '24px',
                    border: '1px solid',
                    borderColor: 'error.light',
                    bgcolor: 'background.paper'
                }}
            >
                <Stack spacing={3} alignItems="center" textAlign="center">
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: 'error.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1
                        }}
                        aria-hidden="true"
                    >
                        <AlertTriangle size={32} color="currentColor" />
                    </Box>

                    <Typography variant="h5" component="h1" fontWeight={700}>
                        {t('error.boundary.title', 'Bir Hata Oluştu')}
                    </Typography>

                    {moduleName && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {t('error.boundary.module', 'Modül')}: {moduleName}
                        </Typography>
                    )}

                    <Typography variant="body1" color="text.secondary">
                        {t('error.boundary.message', 'Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.')}
                    </Typography>

                    {import.meta.env.DEV && error && (
                        <Box
                            sx={{
                                width: '100%',
                                p: 2,
                                bgcolor: 'grey.100',
                                borderRadius: '12px',
                                textAlign: 'left',
                                maxHeight: 200,
                                overflow: 'auto'
                            }}
                            role="region"
                            aria-label={t('error.boundary.details', 'Hata detayları')}
                        >
                            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {error.toString()}
                                {errorInfo?.componentStack && `\n\n${errorInfo.componentStack}`}
                            </Typography>
                        </Box>
                    )}

                    <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<RefreshCw size={18} />}
                            onClick={onReset}
                            fullWidth
                            sx={{ borderRadius: '12px' }}
                            aria-label={t('error.boundary.retry', 'Tekrar Dene')}
                        >
                            {t('error.boundary.retry', 'Tekrar Dene')}
                        </Button>
                        {isPageLevel && (
                            <Button
                                variant="outlined"
                                startIcon={<Home size={18} />}
                                onClick={() => navigate('/')}
                                fullWidth
                                sx={{ borderRadius: '12px' }}
                                aria-label={t('error.boundary.home', 'Ana Sayfa')}
                            >
                                {t('error.boundary.home', 'Ana Sayfa')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
};

/**
 * Hook-based Error Boundary Wrapper
 * For functional components that need error boundaries
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
    const WrappedComponent = (props) => (
        <ErrorBoundaryClass {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundaryClass>
    );
    
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
    
    return WrappedComponent;
};

/**
 * Module-specific Error Boundary
 * Her modül kendi error boundary'sini oluşturabilir
 */
export const ModuleErrorBoundary = ({ moduleName, children, fallback, level = 'component' }) => {
    return (
        <ErrorBoundaryClass moduleName={moduleName} level={level} fallback={fallback}>
            {children}
        </ErrorBoundaryClass>
    );
};

export default ErrorBoundaryClass;
