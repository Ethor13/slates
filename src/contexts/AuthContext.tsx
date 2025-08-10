import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithCustomToken,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define UserPreferences interface
interface UserPreferences {
    zipcode: string;
    timezone: string;
    tvProviders: Record<string, string>; // Changed from string[] to Record<string, string>
    favoriteTeams: Record<string, string>[];
    notificationEmails: string[];
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
    userLoading: boolean;
    userPreferences: UserPreferences;
    preferencesLoading: boolean;
    tvChannels: Record<string, Provider>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithToken: (token: string) => Promise<void>;
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
    timezone: '',
    tvProviders: {},
    favoriteTeams: [],
    notificationEmails: [],
    showOnlyAvailableBroadcasts: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // userLoading should represent ONLY the initial auth state resolution
    const [userLoading, setUserLoading] = useState(true);
    const [preferencesLoading, setPreferencesLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());
    const [tvChannels, setTvChannels] = useState<Record<string, Provider>>({});

    // Listen for auth state changes (initial + subsequent sign-in/out)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            // Once first auth state is known, loading ends
            setUserLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const setUserPreferencesFromFirestore = async () => {
            setPreferencesLoading(true);

            if (!currentUser || userLoading) {
                setUserPreferences(getDefaultPreferences());
                setPreferencesLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (!userDoc.exists()) {
                    // Set default preferences first, then save to Firestore
                    const defaultPrefs = getDefaultPreferences();
                    setUserPreferences(defaultPrefs);
                    await setDoc(userDocRef, defaultPrefs);
                } else {
                    const userData = userDoc.data() as UserPreferences;
                    setUserPreferences({
                        ...getDefaultPreferences(),
                        ...userData
                    });
                }
            } catch (error) {
                console.error(`Error setting up preferences listener for ${currentUser?.email}:`, error);
            } finally {
                setPreferencesLoading(false);
            }
        }

        setUserPreferencesFromFirestore();
    }, [currentUser, userLoading]);

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
        // Do not toggle userLoading here; rely on initial listener. Actions can have their own UI.
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            throw error;
        }
    };

    const signInWithToken = async (token: string) => {
        // Avoid leaving global loading stuck; do not set userLoading true.
        try {
            await signInWithCustomToken(auth, token);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            throw error;
        }
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
        userLoading,
        userPreferences,
        tvChannels,
        preferencesLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithToken,
        logout,
        resetPassword,
        updateUserPreferences
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};