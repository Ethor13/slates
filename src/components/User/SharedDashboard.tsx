import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useJWT } from '../../contexts/JWTContext';
import Dashboard from './Dashboard';

const SharedDashboard = () => {
  const { token } = useParams<{ token: string }>();
  const { jwtUser, loading, verifyToken } = useJWT();
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setVerificationAttempted(true);
        return;
      }

      try {
        const isValid = await verifyToken(token);
        setIsValidToken(isValid);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
      } finally {
        setVerificationAttempted(true);
      }
    };

    validateToken();
  }, [token, verifyToken]);

  // Show loading while verifying token
  if (loading || !verificationAttempted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if token is invalid or missing
  if (!token || !isValidToken || !jwtUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid or Expired Link</h1>
          <p className="text-gray-600 mb-6">
            This shareable link is invalid or has expired. Please contact the person who shared this link for a new one.
          </p>
          {/* <Navigate to="/auth" replace /> */}
        </div>
      </div>
    );
  }

  // Render the dashboard with JWT user context
  return <Dashboard isJWTUser={true} jwtUserPreferences={jwtUser.userPreferences} />;
};

export default SharedDashboard;
