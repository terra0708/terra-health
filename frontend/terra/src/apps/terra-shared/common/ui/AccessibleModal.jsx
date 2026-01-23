import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { X } from 'lucide-react';
import { focusManagement } from '@common/utils';

/**
 * Accessible Modal Component
 * 
 * Accessibility özellikleri ile geliştirilmiş modal component
 * - Focus trap
 * - ARIA attributes
 * - Keyboard navigation
 * - Screen reader support
 */
const AccessibleModal = ({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = 'sm',
    fullWidth = true,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...props
}) => {
    const dialogRef = useRef(null);
    const titleId = `dialog-title-${React.useId()}`;
    const descriptionId = `dialog-description-${React.useId()}`;

    // Focus trap when modal opens
    useEffect(() => {
        if (open && dialogRef.current) {
            const cleanup = focusManagement.trapFocus(dialogRef.current);
            return cleanup;
        }
    }, [open]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            aria-labelledby={ariaLabelledBy || titleId}
            aria-describedby={ariaDescribedBy || descriptionId}
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            {...props}
        >
            {title && (
                <DialogTitle id={titleId}>
                    {title}
                    <IconButton
                        aria-label="Close dialog"
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
            )}
            <DialogContent id={descriptionId}>
                {children}
            </DialogContent>
            {actions && (
                <DialogActions>
                    {actions}
                </DialogActions>
            )}
        </Dialog>
    );
};

export default AccessibleModal;
