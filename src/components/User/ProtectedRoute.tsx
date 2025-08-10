import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTemp?: boolean;
}

export default function ProtectedRoute({ children, redirectTemp = false }: ProtectedRouteProps) {
    const { currentUser, userLoading } = useAuth();

    if (userLoading) {
         <div className="flex justify-center p-8">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
              role="status"
              aria-label="Loading"
            />
         </div>;
    }

    if (!currentUser) {
        return <Navigate to="/auth" />;
    }

    // Check if user is a temp user (has : in uid) and redirectTemp is enabled
    if (redirectTemp && currentUser.uid.includes(':')) {
        return <Navigate to="/dashboard" />;
    }

    return <>{children}</>;
}