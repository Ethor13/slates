import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTemp?: boolean;
}

export default function ProtectedRoute({ children, redirectTemp = false }: ProtectedRouteProps) {
    const { currentUser, userLoading } = useAuth();

    // RETURN a loading placeholder while Firebase restores the auth session.
    // Previously this block did not return anything, so the code fell through
    // with currentUser still null and incorrectly redirected to /auth on refresh.
    if (userLoading) {
        return (
            <div className="flex justify-center p-8">
                <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
                    role="status"
                    aria-label="Loading"
                />
            </div>
        );
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