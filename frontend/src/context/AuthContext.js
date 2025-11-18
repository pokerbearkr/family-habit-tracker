import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);

      let errorMessage = 'Login failed';
      if (error.response) {
        // 서버가 응답을 반환한 경우
        errorMessage = error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = 'No response from server. Please check if backend is running.';
      } else {
        // 요청 설정 중 에러가 발생한 경우
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const signup = async (username, email, password, displayName) => {
    try {
      await authAPI.signup(username, email, password, displayName);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserFamily = (familyId, familyName) => {
    if (user) {
      const updatedUser = {
        ...user,
        familyId,
        familyName
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const updateUser = (updatedUserData) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...updatedUserData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUserFamily,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
