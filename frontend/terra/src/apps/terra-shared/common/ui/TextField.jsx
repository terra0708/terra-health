import { TextField as MuiTextField } from '@mui/material';

/**
 * Proje genelinde kullanılan özelleştirilmiş TextField bileşeni.
 */
const TextField = ({ select, SelectProps, ...props }) => {
    // SelectProps içindeki button prop'unu kaldır (MUI v6'da kullanılmıyor)
    const cleanedSelectProps = SelectProps ? (() => {
        const { button, ...rest } = SelectProps;
        return rest;
    })() : undefined;

    return (
        <MuiTextField
            fullWidth
            variant="outlined"
            margin="normal"
            select={select}
            SelectProps={cleanedSelectProps}
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
