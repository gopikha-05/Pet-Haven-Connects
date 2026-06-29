import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import { getToken, setToken, setRefreshToken, clearToken, decodeToken, isTokenExpired, getRememberMe } from '@/utils/jwt';
import { ROLE_DASHBOARD_PATHS } from '@/constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const loadUserFromToken = useCallback(async () => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      clearToken();
      setUser(null);
      return null;
    }
    const decoded = decodeToken(token);
    if (decoded) {
      const baseUser = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };
      setUser(baseUser);
      
      try {
        const fullProfile = await authService.getProfile();
        setUser({ ...baseUser, ...fullProfile, id: fullProfile._id || decoded.sub });
      } catch (err) {
        console.error('Failed to fetch full user profile:', err);
      }
      return decoded;
    }
    return null;
  }, []);

  useEffect(() => {
    loadUserFromToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password, remember = false) => {
    const { data } = await authService.login(email, password);
    setToken(data.accessToken, remember);
    setRefreshToken(data.refreshToken, remember);
    
    try {
      const fullProfile = await authService.getProfile();
      const updatedUser = { ...data.user, ...fullProfile, id: fullProfile._id || data.user.id };
      setUser(updatedUser);
      return { user: updatedUser, redirect: ROLE_DASHBOARD_PATHS[updatedUser.role] };
    } catch (err) {
      setUser(data.user);
      return { user: data.user, redirect: ROLE_DASHBOARD_PATHS[data.user.role] };
    }
  };

  const register = async (formData, remember = false) => {
    const response = await authService.register(formData);
    const data = response.data || response;
    
    if (data.user) {
      setToken(data.accessToken, remember);
      setRefreshToken(data.refreshToken, remember);
      
      try {
        const fullProfile = await authService.getProfile();
        const updatedUser = { ...data.user, ...fullProfile, id: fullProfile._id || data.user.id };
        setUser(updatedUser);
        return { user: updatedUser, message: data.message, redirect: ROLE_DASHBOARD_PATHS[updatedUser.role] };
      } catch (err) {
        setUser(data.user);
        return { user: data.user, message: data.message, redirect: ROLE_DASHBOARD_PATHS[data.user.role] };
      }
    }
    
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      const mappedUser = { ...updatedUser, id: updatedUser._id || updatedUser.id };
      setUser(mappedUser);
      return mappedUser;
    } catch (error) {
      console.error('Failed to save profile changes:', error);
      setUser((prev) => ({ ...prev, ...updates }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        rememberMe: getRememberMe(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
