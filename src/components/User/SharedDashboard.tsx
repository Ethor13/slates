import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from './Dashboard';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SharedDashboard = () => {
  const { token } = useParams<{ token: string }>();
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { signInWithToken } = useAuth();
  const navigate = useNavigate();

  // Function to sign in with JWT token
  const signInWithJWTToken = async (jwtToken: string): Promise<void> => {
    const response = await fetch(`/signInWithJWT?token=${encodeURIComponent(jwtToken)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sign in with JWT token');
    }
    
    const result = await response.json();
    
    // Use the Firebase custom token to sign in
    await signInWithToken(result.firebaseToken);
    
    console.log('Signed in as:', result.userInfo);
  };

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setVerificationAttempted(true);
        setErrorMessage('No token provided in the URL.');
        return;
      }

      try {
        // Sign in using the JWT token
        await signInWithJWTToken(token);
        
        setIsValidToken(true);
        console.log('JWT Token verified and user signed in successfully');
        
        // Navigate to dashboard after successful verification
        navigate("/dashboard");
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        
        if (error instanceof Error) {
          if (error.message.includes('expired') || error.message.includes('Expired')) {
            setErrorMessage('This shareable link has expired. Please request a new one.');
          } else if (error.message.includes('Invalid') || error.message.includes('invalid')) {
            setErrorMessage('This shareable link is invalid. Please check the URL or request a new one.');
          } else {
            setErrorMessage('Failed to verify the shareable link. Please try again.');
          }
        } else {
          setErrorMessage('Failed to verify the shareable link. Please try again.');
        }
      } finally {
        setVerificationAttempted(true);
      }
    };

    validateToken();
  }, [token, navigate, signInWithToken]); // Added dependencies

  // Redirect to auth if token is invalid or missing
  if (verificationAttempted && (!token || !isValidToken)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4 w-full">
            <Link to="/">
                <img src="/assets/logos/slates.svg" alt="Slates Logo" className="h-24 w-24" />
            </Link>
            ️</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{errorMessage}</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Please contact the Account Owner for a new one
          </p>
        </div>
      </div>
    );
  }

  // Show loading while verifying token
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm sm:text-base text-gray-600">Verifying access...</p>
      </div>
    </div>
  );
};

export default SharedDashboard;
