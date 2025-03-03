import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NavDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();

  return (
    <>
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold text-white">Slates</Link>
      </div>
      <div className="hidden md:flex items-center space-x-8">
        <div className="flex items-center space-x-4">
          {currentUser && (
            <>
              <span className="text-white">{currentUser.email}</span>
              <button
                onClick={() => logout()}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NavDashboard;