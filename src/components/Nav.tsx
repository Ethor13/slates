import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

const Nav = () => {
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isAuthPage = location.pathname === '/auth';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Function to handle smooth scrolling on landing page
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
        <nav className="fixed top-0 w-full backdrop-blur-sm z-50 bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-white">Slates</Link>
                    </div>
                    
                    {!isAuthPage && (
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
                                <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
                                    <div 
                                        className="flex items-center space-x-2 text-white cursor-pointer select-none"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        onMouseEnter={() => setIsDropdownOpen(true)}
                                    >
                                        <span>{currentUser.email}</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    {isDropdownOpen && (
                                        <div 
                                            className="absolute right-0 top-12 w-48 py-2 bg-white rounded-lg shadow-lg z-50"
                                            onMouseLeave={() => setIsDropdownOpen(false)}
                                        >
                                            <Link 
                                                to="/dashboard" 
                                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            <Link 
                                                to="/settings" 
                                                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                User Settings
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Nav;