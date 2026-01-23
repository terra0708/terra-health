/**
 * Performance Utilities
 * 
 * Modüler yapıya uygun performance helper fonksiyonları ve hooks
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function
 */
export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * useDebounce hook
 */
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * useThrottle hook
 */
export const useThrottle = (value, limit) => {
    const [throttledValue, setThrottledValue] = React.useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, limit - (Date.now() - lastRan.current));

        return () => {
            clearTimeout(handler);
        };
    }, [value, limit]);

    return throttledValue;
};

/**
 * useMemoizedCallback - Memoized callback with dependency array
 */
export const useMemoizedCallback = (callback, deps) => {
    return useCallback(callback, deps);
};

/**
 * useMemoizedValue - Memoized value with dependency array
 */
export const useMemoizedValue = (factory, deps) => {
    return useMemo(factory, deps);
};

/**
 * useIntersectionObserver - Lazy load images/components
 */
export const useIntersectionObserver = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = React.useState(false);
    const [hasIntersected, setHasIntersected] = React.useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
            if (entry.isIntersecting && !hasIntersected) {
                setHasIntersected(true);
            }
        }, {
            threshold: 0.1,
            ...options
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [hasIntersected, options]);

    return [elementRef, isIntersecting, hasIntersected];
};

/**
 * useLazyLoad - Lazy load component when in viewport
 */
export const useLazyLoad = (options = {}) => {
    const [elementRef, isIntersecting] = useIntersectionObserver(options);
    return [elementRef, isIntersecting];
};

/**
 * useVirtualization - Virtual scrolling helper
 */
export const useVirtualization = (items, itemHeight, containerHeight) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;
    const totalHeight = items.length * itemHeight;

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    return {
        visibleItems,
        offsetY,
        totalHeight,
        handleScroll,
        startIndex,
        endIndex
    };
};

/**
 * useImagePreload - Preload images
 */
export const useImagePreload = (src) => {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    useEffect(() => {
        if (!src) return;

        const img = new Image();
        img.onload = () => setLoaded(true);
        img.onerror = () => setError(true);
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return { loaded, error };
};

/**
 * usePerformanceMonitor - Monitor component performance
 */
export const usePerformanceMonitor = (componentName) => {
    const renderStartTime = useRef(null);

    useEffect(() => {
        if (import.meta.env.DEV) {
            renderStartTime.current = performance.now();
            
            return () => {
                const renderTime = performance.now() - renderStartTime.current;
                if (renderTime > 16) { // More than one frame (60fps)
                    console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
                }
            };
        }
    }, [componentName]);
};

/**
 * Batch updates helper
 */
export const batchUpdates = (updates) => {
    React.unstable_batchedUpdates(() => {
        updates.forEach(update => update());
    });
};

export default {
    debounce,
    throttle,
    useDebounce,
    useThrottle,
    useMemoizedCallback,
    useMemoizedValue,
    useIntersectionObserver,
    useLazyLoad,
    useVirtualization,
    useImagePreload,
    usePerformanceMonitor,
    batchUpdates
};
