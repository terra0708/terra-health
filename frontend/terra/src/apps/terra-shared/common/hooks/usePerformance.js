import { useEffect, useRef } from 'react';

/**
 * usePerformance Hook
 * 
 * Component performance monitoring için hook
 * Development modunda render sürelerini loglar
 */
export const usePerformance = (componentName) => {
    const renderStartTime = useRef(null);
    const renderCount = useRef(0);

    useEffect(() => {
        if (import.meta.env.DEV) {
            renderStartTime.current = performance.now();
            renderCount.current += 1;
            
            return () => {
                const renderTime = performance.now() - renderStartTime.current;
                if (renderTime > 16) { // More than one frame (60fps)
                    console.warn(
                        `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (Render #${renderCount.current})`
                    );
                }
            };
        }
    }, [componentName]);

    return {
        renderCount: renderCount.current
    };
};

export default usePerformance;
