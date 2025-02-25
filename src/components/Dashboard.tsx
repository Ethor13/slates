import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const { currentUser, logout } = useAuth();

    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div className="flex items-center">
                                <span className="text-xl font-bold text-gray-900">Dashboard</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700">{currentUser?.email}</span>
                                <button
                                    onClick={() => logout()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    {/* Add your dashboard content here */}
                    <h1 className="text-2xl font-bold text-gray-900">Welcome to your dashboard!</h1>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;