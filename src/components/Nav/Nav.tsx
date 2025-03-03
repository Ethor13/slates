import { useLocation } from 'react-router-dom';

// Import all nav component variants
import NavLogo from './NavLogo';
import NavHome from './NavHome';
import NavDashboard from './NavDashboard';

const Nav = () => {
    const location = useLocation();
    
    // Determine which component to render based on current path
    const renderNavComponent = () => {
        if (location.pathname === '/auth') {
            return <NavLogo />;
        } else if (location.pathname === '/dashboard') {
            return <NavDashboard />;
        } else {
            // Default to home navigation for all other routes
            return <NavHome />;
        }
    };
    
    return (
        <nav className="fixed top-0 w-full backdrop-blur-sm z-50 bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {renderNavComponent()}
                </div>
            </div>
        </nav>
    );
};

export default Nav;