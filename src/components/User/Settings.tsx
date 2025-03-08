import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Nav from '../Nav';
import { 
    ZipcodeInput, 
    TvProviders, 
    FavoriteTeams, 
    SavePreferencesButton 
} from './Preferences';

interface UserPreferences {
    zipcode: string;
    tvProviders: string[];
    favoriteTeams: string[];
}

const Settings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [zipcodeError, setZipcodeError] = useState<string | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences>({
        zipcode: '',
        tvProviders: [],
        favoriteTeams: []
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserPreferences;
                    setPreferences({
                        zipcode: userData.zipcode || '',
                        tvProviders: userData.tvProviders || [],
                        favoriteTeams: userData.favoriteTeams || []
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleZipcodeChange = (zipcode: string) => {
        if (zipcodeError) setZipcodeError(null);
        setPreferences(prev => ({
            ...prev,
            zipcode
        }));
    };

    const handleTvProviderToggle = (provider: string) => {
        setPreferences(prev => ({
            ...prev,
            tvProviders: prev.tvProviders.includes(provider) 
                ? prev.tvProviders.filter(p => p !== provider)
                : [...prev.tvProviders, provider]
        }));
    };

    const handleTeamToggle = (team: string) => {
        setPreferences(prev => ({
            ...prev,
            favoriteTeams: prev.favoriteTeams.includes(team)
                ? prev.favoriteTeams.filter(t => t !== team)
                : [...prev.favoriteTeams, team]
        }));
    };

    const savePreferences = async () => {
        if (!currentUser) return;
        
        if (!preferences.zipcode || preferences.zipcode.length !== 5) {
            setZipcodeError('Please enter a valid 5-digit zipcode');
            return;
        }
        setSaveStatus('saving');
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, preferences, { merge: true });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Nav />
            <div className="min-h-screen bg-gray-50 pt-16">
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Settings</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Update your preferences to get personalized sports programming recommendations
                            </p>
                            
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="mt-6 space-y-8">
                                    <ZipcodeInput 
                                        zipcode={preferences.zipcode} 
                                        onChange={handleZipcodeChange}
                                        error={zipcodeError}
                                    />
                                    
                                    <TvProviders 
                                        selectedProviders={preferences.tvProviders} 
                                        onToggle={handleTvProviderToggle} 
                                    />
                                    
                                    <FavoriteTeams 
                                        selectedTeams={preferences.favoriteTeams} 
                                        onToggle={handleTeamToggle} 
                                    />
                                    
                                    <SavePreferencesButton 
                                        onSave={savePreferences} 
                                        saveStatus={saveStatus} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;