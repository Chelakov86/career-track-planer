import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// Add type definition for window.google
declare global {
  interface Window {
    google?: any;
  }
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isRealAuthAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT from Google
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if we have a real Client ID provided in environment
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const isRealAuthAvailable = !!CLIENT_ID;

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('career_track_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Initialize Google Sign-In if available
  useEffect(() => {
    if (!isRealAuthAvailable) return;

    const initializeGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false // Don't auto-select to give user choice
        });
      } else {
        // Retry if script hasn't loaded
        setTimeout(initializeGoogleAuth, 100);
      }
    };

    initializeGoogleAuth();
  }, [isRealAuthAvailable, CLIENT_ID]);

  const handleCredentialResponse = (response: any) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      const newUser: User = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.picture
      };
      
      setUser(newUser);
      localStorage.setItem('career_track_user', JSON.stringify(newUser));
    }
  };

  const login = async () => {
    // This is the Mock Login fallback
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: 'mock_user_' + Math.floor(Math.random() * 10000),
      name: 'Demo User',
      email: 'demo@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
    };
    
    setUser(mockUser);
    localStorage.setItem('career_track_user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('career_track_user');
    // If real auth, we might want to disable auto-select on next load
    if (isRealAuthAvailable && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isRealAuthAvailable }}>
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
