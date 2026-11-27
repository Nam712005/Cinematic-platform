import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { tokenStorage } from '../utils/storage.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.getAccessToken()));

  const refreshProfile = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setInitializing(false);
      return null;
    }

    try {
      const res = await authApi.getMyProfile();
      const profile = res?.data || null;
      setUser(profile);
      tokenStorage.setUser(profile);
      return profile;
    } catch {
      tokenStorage.clearAll();
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getAccessToken()) {
      refreshProfile();
    } else {
      setInitializing(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    const handleForceLogout = (event) => {
      setUser(null);
      if (event.detail?.reason) {
        toast.warning(event.detail.reason);
      }
    };

    window.addEventListener('cinematic:auth-logout', handleForceLogout);
    return () => window.removeEventListener('cinematic:auth-logout', handleForceLogout);
  }, [toast]);

  const login = useCallback(async ({ identifier, password, remember_me = false }) => {
    const res = await authApi.login({ identifier, password, remember_me });
    const { access_token, refresh_token, user: loggedInUser, redirect_to } = res.data;
    tokenStorage.setTokens(access_token, refresh_token);
    tokenStorage.setUser(loggedInUser);
    setUser(loggedInUser);
    return { user: loggedInUser, redirectTo: redirect_to || '/' };
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Proceed clearing local session regardless of network state
    } finally {
      tokenStorage.clearAll();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isPremium: Boolean(user?.is_premium),
      initializing,
      login,
      register,
      logout,
      refreshProfile,
      setUser: (nextUser) => {
        tokenStorage.setUser(nextUser);
        setUser(nextUser);
      },
    }),
    [user, initializing, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
