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
export interface UserPreferences {
    zipcode: string;
    tvProviders: string[];
    favoriteTeams: Record<string, string>[];
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    userPreferences: UserPreferences;
    preferencesLoading: boolean;
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
    tvProviders: [],
    favoriteTeams: []
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [preferencesLoading, setPreferencesLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Listen for user preferences changes
    useEffect(() => {
        const setupPreferencesListener = async () => {
            if (!currentUser) {
                setUserPreferences(getDefaultPreferences());
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