import { Button as MuiButton } from '@mui/material';

/**
 * Proje genelinde kullanılan özelleştirilmiş Buton bileşeni.
 * MUI Button'ı sarmalar ve stabil bir arayüz sağlar.
 */
const Button = ({ children, variant = 'contained', color = 'primary', ...props }) => {
    return (
        <MuiButton
            variant={variant}
            color={color}
            disableElevation
            {...props}
        >
            {children}
        </MuiButton>
    );
};

export default Button;
