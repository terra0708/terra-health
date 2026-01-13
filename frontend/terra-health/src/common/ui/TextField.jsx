import { TextField as MuiTextField } from '@mui/material';

/**
 * Proje genelinde kullanılan özelleştirilmiş TextField bileşeni.
 */
const TextField = ({ ...props }) => {
    return (
        <MuiTextField
            fullWidth
            variant="outlined"
            margin="normal"
            {...props}
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
            }}
        />
    );
};

export default TextField;
