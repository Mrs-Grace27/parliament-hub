import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/services/api';
import { socketService } from '@/services/socket';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('parliament_token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.user);
          
          // Connect to socket with authenticated user
          socketService.connect(response.user.id);
        } catch (error) {
          console.error('Failed to validate token:', error);
          localStorage.removeItem('parliament_token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      
      localStorage.setItem('parliament_token', response.token);
      setUser(response.user);
      
      // Connect to socket after successful login
      socketService.connect(response.user.id);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(name, email, password, role);
      
      localStorage.setItem('parliament_token', response.token);
      setUser(response.user);
      
      // Connect to socket after successful registration
      socketService.connect(response.user.id);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('parliament_token');
      setUser(null);
      
      // Disconnect socket on logout
      socketService.disconnect();
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};