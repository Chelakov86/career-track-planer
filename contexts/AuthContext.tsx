import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('career_track_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async () => {
    setIsLoading(true);
    // Simulate API call to Google Auth Provider
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data simulating a Google User Object
    const mockUser: User = {
      id: 'google_user_12345',
      name: 'Alex Developer',
      email: 'alex.dev@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    };
    
    setUser(mockUser);
    localStorage.setItem('career_track_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('career_track_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
