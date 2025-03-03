import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NavHome: React.FC = () => {
  const { currentUser, logout } = useAuth();

  // Function to handle smooth scrolling
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold text-white">Slates</Link>
      </div>
      <div className="hidden md:flex items-center space-x-8">
        {!currentUser ? (
          <>
            <a 
              href="#technology" 
              className="text-white hover:text-blue-200"
              onClick={(e) => scrollToSection(e, 'technology')}
            >Technology</a>
            <a 
              href="#benefits" 
              className="text-white hover:text-blue-200"
              onClick={(e) => scrollToSection(e, 'benefits')}
            >Benefits</a>
            <a 
              href="#demo" 
              className="text-white hover:text-blue-200"
              onClick={(e) => scrollToSection(e, 'demo')}
            >Live Demo</a>
            <a 
              href="#pricing" 
              className="text-white hover:text-blue-200"
              onClick={(e) => scrollToSection(e, 'pricing')}
            >Pricing</a>
            <Link
              to="/auth"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
            >
              Sign In
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-white hover:text-blue-200 transition">Dashboard</Link>
            <div className="flex items-center space-x-4">
              <span className="text-white">{currentUser.email}</span>
              <button
                onClick={() => logout()}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NavHome;