/**
 * Stateless API: access and refresh tokens stored in sessionStorage.
 * Not persisted to localStorage (compliance). Cleared when tab closes.
 */
const ACCESS_TOKEN_KEY = 'terra_access_token';
const REFRESH_TOKEN_KEY = 'terra_refresh_token';

export function getToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setToken(token) {
    if (token != null) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function setRefreshToken(token) {
    if (token != null) sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    else sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
    setToken(accessToken);
    setRefreshToken(refreshToken);
}

export function clearTokens() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
