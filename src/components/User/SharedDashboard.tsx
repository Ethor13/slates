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

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setVerificationAttempted(true);
        setErrorMessage('No token provided in the URL.');
        return;
      }

      if (verificationAttempted) return;

      try {
        await signInWithToken(token);
        setIsValidToken(true);
        navigate("/dashboard");
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        setErrorMessage('Failed to verify the shareable link. Please try again.');
      } finally {
        setVerificationAttempted(true);
      }
    };

    validateToken();
  }, [token]);

  // Show loading while verifying token
  if (!verificationAttempted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if token is invalid or missing
  if (!token || !isValidToken) {
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
};

export default SharedDashboard;
