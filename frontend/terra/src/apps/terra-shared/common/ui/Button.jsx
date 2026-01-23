import React from 'react';
import { Button as MuiButton } from '@mui/material';

/**
 * Proje genelinde kullanılan özelleştirilmiş Buton bileşeni.
 * MUI Button'ı sarmalar ve stabil bir arayüz sağlar.
 * 
 * Performance: React.memo ile optimize edilmiş
 * Accessibility: ARIA attributes ve keyboard navigation desteği
 */
const Button = React.memo(({ 
    children, 
    variant = 'contained', 
    color = 'primary',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
}) => {
    return (
        <MuiButton
            variant={variant}
            color={color}
            disableElevation
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            {...props}
        >
            {children}
        </MuiButton>
    );
});

Button.displayName = 'Button';

export default Button;
