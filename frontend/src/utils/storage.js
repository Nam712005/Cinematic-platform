const ACCESS_TOKEN_KEY = 'cinematic_access_token';
const REFRESH_TOKEN_KEY = 'cinematic_refresh_token';
const USER_CACHE_KEY = 'cinematic_user';

export const tokenStorage = {
  getAccessToken() {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  setTokens(accessToken, refreshToken) {
    try {
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // Ignore storage quota errors
    }
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  },
  clearAll() {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch {
      // Ignore
    }
  },
};
