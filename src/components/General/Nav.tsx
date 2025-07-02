import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, GalleryVertical, LogOut, Mail, Settings, X } from 'lucide-react';
import { User } from 'firebase/auth/web-extension';

const getDisplayName = (user: User) => {
    return user.email || user.uid.split(":").at(-1);
};

const Nav = () => {
    const { currentUser, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle clicks outside the menu to close it
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        // Prevent scrolling when menu is open
        const handleBodyScroll = () => {
            document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
            return () => {
                document.body.style.overflow = 'auto';
            };
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            handleBodyScroll();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'auto';
        };
    }, [isMenuOpen]);

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
        <>
            <nav className="fixed top-0 w-full z-40 bg-transparent h-20">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-row gap-4 h-[5rem] items-center">
                        <div className="flex items-center space-x-2">
                            <Link to="/">
                                <img src="/assets/logos/slates_white_outline.svg" alt="Slates Logo" className="h-12 w-12"/>
                            </Link>
                        </div>
                        <div className="flex flex-row items-center justify-between w-full">
                            {!currentUser ? (
                                <>
                                    <div className='hidden md:flex items-center space-x-2'>
                                        <a
                                            href="#technology"
                                            className="text-black font-semibold text-lg rounded-full hover:bg-slate-light hover:bg-opacity-20 px-4 py-2"
                                            onClick={(e) => scrollToSection(e, 'technology')}
                                        >Technology</a>
                                        <a
                                            href="#benefits"
                                            className="text-black font-semibold text-lg rounded-full hover:bg-slate-light hover:bg-opacity-20 px-4 py-2"
                                            onClick={(e) => scrollToSection(e, 'benefits')}
                                        >Benefits</a>
                                        <a
                                            href="#demo"
                                            className="text-black font-semibold text-lg rounded-full hover:bg-slate-light hover:bg-opacity-20 px-4 py-2"
                                            onClick={(e) => scrollToSection(e, 'demo')}
                                        >Live Demo</a>
                                        <a
                                            href="#pricing"
                                            className="text-black font-semibold text-lg rounded-full hover:bg-slate-light hover:bg-opacity-20 px-4 py-2"
                                            onClick={(e) => scrollToSection(e, 'pricing')}
                                        >Pricing</a>
                                    </div>
                                    <div className="flex space-x-4">
                                        <Link
                                            to="/auth?mode=signin"
                                            className="border-2 font-semibold border-slate-deep text-slate-deep px-6 py-2 rounded-full hover:bg-slate-light hover:border-slate-light hover:text-white transition-all duration-200"
                                        >
                                            Log In
                                        </Link>
                                        <Link
                                            to="/auth?mode=signup"
                                            className="border-2 font-semibold border-slate-deep bg-slate-deep text-white px-6 py-2 rounded-full hover:bg-slate-medium hover:border-slate-medium transition-colors duration-200"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        {/* Left side space holder when user is logged in */}
                                    </div>
                                    <div className="flex justify-end">
                                        <div
                                            className="flex items-center text-black font-semibold cursor-pointer select-none hover:bg-slate-deep p-2 rounded-full transition-colors duration-200"
                                            onClick={() => setIsMenuOpen(true)}
                                        >
                                            <span className="hidden sm:block text-lg mr-2 text-white">{getDisplayName(currentUser)}</span>
                                            <Menu className="h-6 w-6 ml-0 text-white" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Side menu overlay - always rendered but conditionally visible for animation */}
            <div className={`fixed inset-0 z-50 overflow-hidden pointer-events-none transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}>
                {/* Backdrop with filter effect */}
                <div
                    className={`fixed inset-0 bg-black/50 ${isMenuOpen ? 'visible' : 'hidden'}`}
                    onClick={() => setIsMenuOpen(false)}
                ></div>

                {/* Side panel */}
                <div
                    ref={menuRef}
                    className={`z-50 fixed inset-y-0 right-0 max-w-xs w-full force-white-bg transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="z-50 h-full flex flex-col overflow-y-auto py-6 px-4">
                        <div className="ml-2 flex items-center justify-between">
                            <h2 className="text-lg font-medium">Account Menu</h2>
                            <button
                                type="button"
                                className="rounded-md text-gray-400 hover:text-slate-deep focus:outline-none transition-colors duration-200"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="ml-2 border-b border-gray-200 py-4">
                            {currentUser ? (
                                <>
                                    <div className="text-sm text-gray-500">Signed in as:</div>
                                    <div className='flex items-center space-x-2 mt-2'>
                                        <Mail className="h-4 w-4 text-slate-deep" />
                                        {/* add elipses if email surpasses a certain length */}
                                        <div className="text-md font-medium text-slate-deep">{getDisplayName(currentUser)}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-500">Not signed in</div>
                            )}
                        </div>

                        <nav className="flex flex-col mt-2">
                            <Link
                                to="/dashboard"
                                className="px-2 py-2 pb-2 block font-semibold hover:bg-opacity-20 text-slate-deep hover:bg-slate-light rounded-md transition-colors duration-200"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="flex items-center">
                                    <GalleryVertical className="h-4 w-4 text-slate-deep inline-block mr-2" />
                                    <p>Dashboard</p>
                                </div>
                            </Link>
                            <Link
                                to="/settings"
                                className="px-2 py-2 block font-semibold text-slate-deep hover:bg-slate-light hover:bg-opacity-20 rounded-md transition-colors duration-200"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <div className="flex items-center">
                                    <Settings className="h-4 w-4 text-slate-deep inline-block mr-2" />
                                    <p>User Settings</p>
                                </div>
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMenuOpen(false);
                                }}
                                className="px-2 py-2 w-full text-left font-semibold text-slate-deep hover:bg-slate-light hover:bg-opacity-20 rounded-md transition-colors duration-200"
                            >
                                <div className="flex items-center">
                                    <LogOut className="h-4 w-4 text-slate-deep inline-block mr-2" />
                                    <p>Logout</p>
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Nav;