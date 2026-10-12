import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, profileService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (storedUser && token) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);

          // Background sync to ensure avatar and profile changes are reflected
          profileService.getProfile()
            .then((res) => {
              if (res.data?.success && res.data?.profile) {
                const p = res.data.profile;
                const freshUser = {
                  ...parsed,
                  name: p.name,
                  email: p.email,
                  avatar: p.avatar,
                  department: p.department,
                  designation: p.designation,
                  phone: p.phone,
                };
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
              }
            })
            .catch(() => {
              // Non-blocking sync error
            });
        } catch (error) {
          console.error("Auth initialization failed", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async (email, password) => {
    try {
      const res = await authService.login(email, password);
      const { user: userData, accessToken, refreshToken } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Attempt to load fresh profile details including avatar
      try {
        const profileRes = await profileService.getProfile();
        if (profileRes.data?.success && profileRes.data?.profile) {
          const p = profileRes.data.profile;
          userData.avatar = p.avatar;
          userData.department = p.department;
          userData.designation = p.designation;
          userData.phone = p.phone;
        }
      } catch (_) {}
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (userData) => {
    try {
      await authService.register(userData);
      // Registration doesn't return tokens in this backend, so we force login after
      return await login(userData.email, userData.password);
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      // Attempt backend logout to invalidate refresh token
      await authService.logout();
    } catch (error) {
      console.error("Backend logout error", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

