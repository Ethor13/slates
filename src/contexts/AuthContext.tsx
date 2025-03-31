import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define UserPreferences interface
interface UserPreferences {
    zipcode: string;
    tvProviders: Record<string, string>; // Changed from string[] to Record<string, string>
    favoriteTeams: Record<string, string>[];
    showOnlyAvailableBroadcasts: boolean;
}

export interface Channel {
    number: string;
    logo: string;
    names: {
        fullName: string;
        name?: string;
        networkName?: string;
    }
}

export interface Provider {
    [channelId: string]: Channel;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    userPreferences: UserPreferences;
    preferencesLoading: boolean;
    tvChannels: Record<string, Provider>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const getDefaultPreferences = (): UserPreferences => ({
    zipcode: '',
    tvProviders: {},
    favoriteTeams: [],
    showOnlyAvailableBroadcasts: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [preferencesLoading, setPreferencesLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());
    const [tvChannels, setTvChannels] = useState<Record<string, Provider>>({});

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Listen for user changes
    useEffect(() => {
        const setupPreferencesListener = async () => {
            if (!currentUser) {
                setUserPreferences(getDefaultPreferences());
                setPreferencesLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    await updateUserPreferences({});
                } else {
                    const userData = userDoc.data() as UserPreferences;
                    setUserPreferences({
                        ...getDefaultPreferences(),
                        ...userData
                    });
                }
            } catch (error) {
                console.error('Error setting up preferences listener:', error);
            } finally {
                setPreferencesLoading(false);
            }
        };

        setupPreferencesListener();
    }, [currentUser]);

    // Listen for provider changes
    useEffect(() => {
        const fetchProviderChannels = async () => {
            const providersChannels: Record<string, any> = {};
            const providerIds = Object.keys(userPreferences.tvProviders);
            
            if (providerIds.length === 0) {
                setTvChannels({});
                return;
            }
            
            try {
                // Use Promise.all to fetch all channels in parallel
                await Promise.all(
                    providerIds.map(async (providerId) => {
                        try {
                            const response = await fetch(`/channels?providerId=${providerId}`);
                            const channels = await response.json();
                            providersChannels[providerId] = channels;
                        } catch (error) {
                            console.error(`Error fetching TV channels for provider ${providerId}:`, error);
                        }
                    })
                );
                
                setTvChannels(providersChannels);
            } catch (error) {
                console.error('Error fetching TV channels:', error);
            }
        };

        fetchProviderChannels();
    }, [userPreferences.tvProviders]);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
        if (!currentUser) throw new Error('No user is signed in');

        try {
            const newPreferences = { ...userPreferences, ...preferences };
            setUserPreferences(newPreferences);
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, newPreferences);
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        userPreferences,
        tvChannels,
        preferencesLoading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        resetPassword,
        updateUserPreferences
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};