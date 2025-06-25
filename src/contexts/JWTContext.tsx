import React, { createContext, useContext, useState } from 'react';

interface JWTUser {
  userId: string;
  userPreferences: any;
  access: string;
  isJWTUser: boolean;
}

interface TokenVerificationResult {
  isValid: boolean;
  errorType?: 'expired' | 'invalid' | 'network' | 'server';
  errorMessage?: string;
}

interface JWTContextType {
  jwtUser: JWTUser | null;
  loading: boolean;
  verifyToken: (token: string) => Promise<boolean>;
  verifyTokenWithDetails: (token: string) => Promise<TokenVerificationResult>;
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

  const verifyTokenWithDetails = async (token: string): Promise<TokenVerificationResult> => {
    setLoading(true);
    try {
      const response = await fetch(`/verifyDashboardToken?token=${encodeURIComponent(token)}`);
      console.log("response", response);
      
      if (response.ok) {
        console.log("okay"); 
        const data = await response.json();
        console.log("data", data);

        if (data.valid) {
          setJwtUser({
            userId: data.userId,
            userPreferences: data.userPreferences,
            access: data.access,
            isJWTUser: true
          });
          return { isValid: true };
        }
        
        return { 
          isValid: false, 
          errorType: 'invalid',
          errorMessage: 'Token is not valid' 
        };
      } else {
        // Handle specific error status codes
        console.log("not okay");
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        let errorType: 'expired' | 'invalid' | 'network' | 'server' = 'server';
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        if (response.status === 401) {
          if (errorMessage.toLowerCase().includes('expired')) {
            errorType = 'expired';
            errorMessage = 'This link has expired';
          } else {
            errorType = 'invalid';
            errorMessage = 'This link is invalid';
          }
        } else if (response.status === 400) {
          errorType = 'invalid';
          errorMessage = 'Invalid link format';
        } else if (response.status >= 500) {
          errorType = 'server';
          errorMessage = 'Server error. Please try again later';
        }
        
        console.error('Token verification failed:', errorMessage);
        setJwtUser(null);
        
        return { 
          isValid: false, 
          errorType,
          errorMessage 
        };
      }
    } catch (error) {
      console.error('Error verifying JWT token:', error);
      setJwtUser(null);
      
      return {
        isValid: false, 
        errorType: 'network',
        errorMessage: 'Network error. Please check your connection and try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    const result = await verifyTokenWithDetails(token);
    return result.isValid;
  };

  const clearJWTUser = () => {
    setJwtUser(null);
  };

  const value: JWTContextType = {
    jwtUser,
    loading,
    verifyToken,
    verifyTokenWithDetails,
    clearJWTUser
  };

  return (
    <JWTContext.Provider value={value}>
      {children}
    </JWTContext.Provider>
  );
};
