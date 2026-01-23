# Common Utilities

Bu klasör proje genelinde kullanılan utility fonksiyonlarını içerir.

## Accessibility (`accessibility.js`)

Accessibility helper fonksiyonları:
- `focusManagement`: Focus trap ve yönetimi
- `ariaHelpers`: ARIA label ve attribute helpers
- `keyboardNavigation`: Keyboard event handlers
- `announceToScreenReader`: Screen reader announcements
- `formAccessibility`: Form field accessibility helpers

## Performance (`performance.js`)

Performance optimization utilities:
- `debounce` / `throttle`: Function debouncing ve throttling
- `useDebounce` / `useThrottle`: React hooks
- `useMemoizedCallback` / `useMemoizedValue`: Memoization helpers
- `useIntersectionObserver`: Lazy loading için intersection observer
- `useLazyLoad`: Component lazy loading hook
- `useVirtualization`: Virtual scrolling helper
- `useImagePreload`: Image preloading hook

## React Query Helpers (`react-query-helpers.js`)

React Query ile çalışmak için helper'lar:
- `useQueryWithLoading`: Loading state ile query hook
- `useMutationWithLoading`: Loading state ile mutation hook
- `withQueryErrorBoundary`: Error boundary wrapper

## Kullanım

```javascript
import { focusManagement, ariaHelpers } from '@common/utils';
import { useDebounce, useLazyLoad } from '@common/utils';
import { useQueryWithLoading } from '@common/utils/react-query-helpers';
```
