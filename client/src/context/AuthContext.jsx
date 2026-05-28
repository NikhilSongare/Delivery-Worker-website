/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchMe, login as apiLogin, logoutLocal, signup as apiSignup } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetchMe();
      if (res.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (payload) => {
    const res = await apiLogin(payload);
    if (res.success) {
      setUser(res.data.user);
    }
    return res;
  }, []);

  const signup = useCallback(async (payload) => {
    const res = await apiSignup(payload);
    if (res.success) {
      setUser(res.data.user);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    logoutLocal();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshMe,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
