import { useAuth } from '../../contexts/AuthContext';

const Nav = () => {
    const { currentUser, logout } = useAuth();
    
    return (
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <a href="/" className="text-xl font-bold text-gray-900">Slates</a>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        {!currentUser ? (
                            <>
                                <a href="#technology" className="text-gray-600 hover:text-blue-600">Technology</a>
                                <a href="#benefits" className="text-gray-600 hover:text-blue-600">Benefits</a>
                                <a href="#demo" className="text-gray-600 hover:text-blue-600">Live Demo</a>
                                <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
                                <a
                                    href="/auth"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Sign In
                                </a>
                            </>
                        ) : (
                            <>
                                <a href="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</a>
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-700">{currentUser.email}</span>
                                    <button
                                        onClick={() => logout()}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Nav;