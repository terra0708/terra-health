import { useState, useCallback } from 'react';

/**
 * useLoading Hook
 * 
 * Loading state yönetimi için hook
 * Modüler yapıya uygun - her modül kendi loading state'ini yönetebilir
 */
export const useLoading = (initialState = false) => {
    const [loading, setLoading] = useState(initialState);
    const [error, setError] = useState(null);

    const startLoading = useCallback(() => {
        setLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setLoading(false);
    }, []);

    const setErrorState = useCallback((errorMessage) => {
        setLoading(false);
        setError(errorMessage);
    }, []);

    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
    }, []);

    const withLoading = useCallback(async (asyncFn) => {
        try {
            startLoading();
            const result = await asyncFn();
            stopLoading();
            return result;
        } catch (err) {
            setErrorState(err.message || 'An error occurred');
            throw err;
        }
    }, [startLoading, stopLoading, setErrorState]);

    return {
        loading,
        error,
        startLoading,
        stopLoading,
        setError: setErrorState,
        reset,
        withLoading
    };
};

export default useLoading;
