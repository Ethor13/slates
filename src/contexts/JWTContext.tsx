import React, { createContext, useContext, useState } from 'react';

interface JWTUser {
  userId: string;
  userPreferences: any;
  access: string;
  isJWTUser: boolean;
}

interface JWTContextType {
  jwtUser: JWTUser | null;
  loading: boolean;
  verifyToken: (token: string) => Promise<boolean>;
  clearJWTUser: () => void;
}

const JWTContext = createContext<JWTContextType | null>(null);

export const useJWT = () => {
  const context = useContext(JWTContext);
  if (!context) {
    throw new Error('useJWT must be used within a JWTProvider');
  }
  return context;
};

export const JWTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jwtUser, setJwtUser] = useState<JWTUser | null>(null);
  const [loading, setLoading] = useState(false);

  const verifyToken = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`/verifyDashboardToken?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      
      if (data.valid) {
        setJwtUser({
          userId: data.userId,
          userPreferences: data.userPreferences,
          access: data.access,
          isJWTUser: true
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying JWT token:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearJWTUser = () => {
    setJwtUser(null);
  };

  const value: JWTContextType = {
    jwtUser,
    loading,
    verifyToken,
    clearJWTUser
  };

  return (
    <JWTContext.Provider value={value}>
      {children}
    </JWTContext.Provider>
  );
};
