import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useAsync Hook
 * 
 * Async işlemler için state yönetimi
 * Modüler yapıya uygun - her modül kendi async işlemlerini yönetebilir
 */
export const useAsync = (asyncFunction, immediate = true) => {
    const [status, setStatus] = useState('idle'); // idle, pending, success, error
    const [value, setValue] = useState(null);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const execute = useCallback(async (...args) => {
        setStatus('pending');
        setValue(null);
        setError(null);

        try {
            const response = await asyncFunction(...args);
            if (mountedRef.current) {
                setValue(response);
                setStatus('success');
            }
            return response;
        } catch (err) {
            if (mountedRef.current) {
                setError(err);
                setStatus('error');
            }
            throw err;
        }
    }, [asyncFunction]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        execute,
        status,
        value,
        error,
        loading: status === 'pending',
        isIdle: status === 'idle',
        isSuccess: status === 'success',
        isError: status === 'error'
    };
};

export default useAsync;
