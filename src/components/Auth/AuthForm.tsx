import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export default function AuthForm() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'signin';
    
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();

    // Update mode when URL changes
    useEffect(() => {
        const urlMode = queryParams.get('mode') === 'signup' ? 'signup' : 'signin';
        setMode(urlMode);
        setEmail('');
        setPassword('');
        setError(null);
    }, [location.search]);

    const handleSetMode = (newMode: AuthMode) => {
        navigate(`/auth?mode=${newMode}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === 'signup') {
                await signUp(email, password);
                navigate('/onboarding');
            } else {
                await signIn(email, password);
                navigate('/dashboard');
            }
        } catch (err) {
            if (mode === 'signup') {
                console.log("Signup Error:", err);
                setError('An error occurred during Sign Up. Please try again.');
            } else {
                console.log("Sign-in Error:", err);
                setError('An error occurred during Log In. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            console.log("Google Sign-in Error:", err);
            setError('An error occurred during Google Log In. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email);
            alert('Password reset instructions have been sent to your email');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen bg-slate-light/10 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <Link to="/">
                            <img src="/assets/logos/slates.svg" alt="Slates Logo" className="h-24 w-24" />
                        </Link>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'signin' ? 'Log in to your account' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => handleSetMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="font-medium text-slate-deep hover:text-slate-medium"
                        >
                            {mode === 'signin' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-light/20">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm h-8">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block h-full w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-medium"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm h-8">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block h-full w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            {mode === 'signin' && (
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        className="text-sm font-medium text-slate-deep hover:text-slate-medium"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            )}
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-slate-deep hover:bg-slate-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-medium disabled:opacity-50 transition-colors duration-200"
                                >
                                    {loading ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        mode === 'signin' ? 'Log in' : 'Sign Up'
                                    )}
                                </button>
                            </div>
                        </form>
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>
                            <div className="mt-5">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full bg-white hover:bg-slate-light hover:border-slate-medium transition-colors duration-200"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5 mr-2" />
                                    Continue with Google
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}