import React from 'react';
import { Box } from '@mui/material';
import { getSkipLinkProps } from '@common/utils';

/**
 * Skip Link Component
 * 
 * Accessibility için skip to main content link
 * Keyboard navigation ile ana içeriğe atlamak için
 */
const SkipLink = ({ targetId = 'main-content' }) => {
    const skipProps = getSkipLinkProps(targetId);

    return (
        <Box
            component="a"
            {...skipProps}
            sx={{
                position: 'absolute',
                top: '-40px',
                left: 0,
                background: 'primary.main',
                color: 'primary.contrastText',
                padding: '8px 16px',
                textDecoration: 'none',
                zIndex: 10000,
                borderRadius: '0 0 4px 0',
                '&:focus': {
                    top: 0,
                },
            }}
        >
            Skip to main content
        </Box>
    );
};

export default SkipLink;
