/**
 * Accessibility Utilities
 * 
 * Modüler yapıya uygun accessibility helper fonksiyonları
 */

/**
 * Skip to main content link component props
 */
export const getSkipLinkProps = (targetId = 'main-content') => ({
    href: `#${targetId}`,
    'aria-label': 'Skip to main content',
    className: 'skip-link'
});

/**
 * Focus management utilities
 */
export const focusManagement = {
    /**
     * Trap focus within an element
     */
    trapFocus: (element) => {
        if (!element) return;

        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement?.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement?.focus();
                    e.preventDefault();
                }
            }
        };

        element.addEventListener('keydown', handleTab);
        firstElement?.focus();

        return () => {
            element.removeEventListener('keydown', handleTab);
        };
    },

    /**
     * Return focus to previous element
     */
    returnFocus: (previousElement) => {
        if (previousElement && typeof previousElement.focus === 'function') {
            previousElement.focus();
        }
    },

    /**
     * Get all focusable elements
     */
    getFocusableElements: (container) => {
        if (!container) return [];
        
        return Array.from(container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.disabled && el.offsetParent !== null);
    }
};

/**
 * ARIA label helpers
 */
export const ariaHelpers = {
    /**
     * Generate aria-label for actions
     */
    actionLabel: (action, target) => {
        return `${action} ${target}`;
    },

    /**
     * Generate aria-describedby for form fields
     */
    describedBy: (fieldId, errorId, helpId) => {
        const ids = [errorId, helpId].filter(Boolean);
        return ids.length > 0 ? ids.join(' ') : undefined;
    },

    /**
     * Generate aria-labelledby for complex components
     */
    labelledBy: (...ids) => {
        return ids.filter(Boolean).join(' ');
    }
};

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
    /**
     * Handle Enter key
     */
    handleEnter: (callback) => (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callback(e);
        }
    },

    /**
     * Handle Escape key
     */
    handleEscape: (callback) => (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            callback(e);
        }
    },

    /**
     * Handle Arrow keys for navigation
     */
    handleArrows: (onUp, onDown, onLeft, onRight) => (e) => {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                onUp?.(e);
                break;
            case 'ArrowDown':
                e.preventDefault();
                onDown?.(e);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                onLeft?.(e);
                break;
            case 'ArrowRight':
                e.preventDefault();
                onRight?.(e);
                break;
        }
    }
};

/**
 * Screen reader announcements
 */
export const announceToScreenReader = {
    /**
     * Create a live region for announcements
     */
    createLiveRegion: (level = 'polite') => {
        const region = document.createElement('div');
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', level);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        region.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(region);
        return region;
    },

    /**
     * Announce message to screen reader
     */
    announce: (message, level = 'polite') => {
        const region = announceToScreenReader.createLiveRegion(level);
        region.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(region);
        }, 1000);
    }
};

/**
 * Form accessibility helpers
 */
export const formAccessibility = {
    /**
     * Get error message ID
     */
    getErrorId: (fieldId) => `${fieldId}-error`,

    /**
     * Get help text ID
     */
    getHelpId: (fieldId) => `${fieldId}-help`,

    /**
     * Get field props with accessibility attributes
     */
    getFieldProps: (fieldId, hasError, helpText) => {
        const errorId = formAccessibility.getErrorId(fieldId);
        const helpId = helpText ? formAccessibility.getHelpId(fieldId) : undefined;
        
        return {
            id: fieldId,
            'aria-invalid': hasError,
            'aria-describedby': ariaHelpers.describedBy(fieldId, hasError ? errorId : undefined, helpId)
        };
    }
};

export default {
    focusManagement,
    ariaHelpers,
    keyboardNavigation,
    announceToScreenReader,
    formAccessibility,
    getSkipLinkProps
};
