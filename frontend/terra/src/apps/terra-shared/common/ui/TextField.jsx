import React from 'react';
import { TextField as MuiTextField } from '@mui/material';
import { formAccessibility } from '@common/utils';

/**
 * Proje genelinde kullanılan özelleştirilmiş TextField bileşeni.
 * 
 * Performance: React.memo ile optimize edilmiş
 * Accessibility: ARIA attributes ve form accessibility desteği
 */
const TextField = React.memo(({ 
    select, 
    SelectProps,
    id,
    error,
    helperText,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props 
}) => {
    // SelectProps içindeki button prop'unu kaldır (MUI v6'da kullanılmıyor)
    const cleanedSelectProps = SelectProps ? (() => {
        const { button, ...rest } = SelectProps;
        return rest;
    })() : undefined;

    // Accessibility props
    const fieldId = id || props.name;
    const errorId = fieldId && error ? formAccessibility.getErrorId(fieldId) : undefined;
    const helpId = fieldId && helperText ? formAccessibility.getHelpId(fieldId) : undefined;
    const fieldProps = fieldId ? formAccessibility.getFieldProps(fieldId, !!error, !!helperText) : {};
    const describedBy = ariaDescribedBy || fieldProps['aria-describedby'];

    return (
        <MuiTextField
            fullWidth
            variant="outlined"
            margin="normal"
            select={select}
            SelectProps={cleanedSelectProps}
            id={fieldId}
            error={error}
            helperText={helperText}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={error}
            {...props}
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
                input: {
                    'aria-invalid': error,
                    'aria-describedby': describedBy,
                },
            }}
        />
    );
});

TextField.displayName = 'TextField';

export default TextField;
