import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounted, checking token...');
    // Check for existing token and validate it
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Found token, validating...');
      validateToken();
    } else {
      console.log('No token found');
      setIsLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      console.log('Validating token...');
      const userData = await authApi.getCurrentUser();
      console.log('Token valid, user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (idToken: string) => {
    try {
      console.log('Google login successful, sending idToken to backend...');
      const result = await authApi.loginWithGoogle(idToken);
      console.log('Login successful, result:', result);
      const { access_token, user } = result;
      localStorage.setItem('token', access_token);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
  };

  console.log('Current auth state:', { user, isAuthenticated: !!user, isLoading });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 