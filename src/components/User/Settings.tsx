import { useState, useEffect, useRef, act } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Nav from '../General/Nav';
import { 
    ZipcodeInput, 
    TvProviders, 
    FavoriteTeams, 
    SavePreferencesButton 
} from './Preferences';
import { MapPin, Tv, Star, User, Bell, Shield, HelpCircle } from 'lucide-react';

interface UserPreferences {
    zipcode: string;
    tvProviders: string[];
    favoriteTeams: Record<string, string>[];
}

interface SettingsSectionProps {
    id: string;
    title: string;
    description: string;
    icon: JSX.Element;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ 
    id, 
    title, 
    description, 
    icon, 
    children 
}) => {
    return (
        <section 
            id={id} 
            className={`scroll-mt-20 py-6 border-b border-gray-200`}
        >
            <div className="flex items-center mb-4">
                <div className="mr-3 p-2 rounded-full bg-slate-light/20 text-slate-deep">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <p className="tddext-sm text-gray-500">{description}</p>
                </div>
            </div>
            <div className="pl-12">
                {children}
            </div>
        </section>
    );
};

const Settings = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [zipcodeError, setZipcodeError] = useState<string | null>(null);
    const [providersLoading, setProvidersLoading] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<Record<string, any>>({});
    const [activeSection, setActiveSection] = useState('location');
    const sectionsRef = useRef<HTMLDivElement>(null);
    
    const [preferences, setPreferences] = useState<UserPreferences>({
        zipcode: '',
        tvProviders: [],
        favoriteTeams: []
    });

    const settingsSections = [
        { id: 'account', title: 'Account', description: 'Manage your account information', icon: <User size={20} /> },
        { id: 'location', title: 'Location', description: 'Set your location for regional sports', icon: <MapPin size={20} /> },
        { id: 'providers', title: 'TV Providers', description: 'Choose your TV providers for channel recommendations', icon: <Tv size={20} /> },
        { id: 'teams', title: 'Favorite Teams', description: 'Select your favorite teams to prioritize their games', icon: <Star size={20} /> },
        { id: 'notifications', title: 'Notifications', description: 'Configure how you receive notifications', icon: <Bell size={20} />, disabled: true },
        { id: 'privacy', title: 'Privacy', description: 'Control your privacy settings', icon: <Shield size={20} />, disabled: true },
        { id: 'help', title: 'Help & Support', description: 'Get assistance with Slates', icon: <HelpCircle size={20} />, disabled: true }
    ];

    const isValidZipcode = (zipcode: string) => zipcode.length === 5;

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
                    
                    // If user already has a valid zipcode, fetch providers
                    if (isValidZipcode(userData.zipcode || '')) {
                        fetchProviders(userData.zipcode);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        // Setup intersection observer for section scrolling
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -80% 0px' }
        );

        // Observe all section elements
        if (sectionsRef.current) {
            const sectionElements = sectionsRef.current.querySelectorAll('section');
            sectionElements.forEach((section) => {
                observer.observe(section);
            });
        }

        return () => {
            observer.disconnect();
        };
    }, [loading]);

    const scrollToSection = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    const fetchProviders = async (zipcode: string) => {
        if (!isValidZipcode(zipcode)) return;
        
        setProvidersLoading(true);
        try {
            // This is an HTTP-only function, not a Callable function
            const response = await fetch(`/service-providers?zipcode=${zipcode}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const providersData = await response.json();
            
            setAvailableProviders(providersData || {});
        } catch (error) {
            console.error('Error fetching TV providers:', error);
            setAvailableProviders({});
        } finally {
            setProvidersLoading(false);
        }
    };

    const handleZipcodeChange = (zipcode: string) => {
        if (zipcodeError) setZipcodeError(null);
        setPreferences(prev => ({
            ...prev,
            zipcode
        }));
        
        // If zipcode becomes valid, fetch providers
        if (isValidZipcode(zipcode)) {
            fetchProviders(zipcode);
            setPreferences(prev => ({
                ...prev,
                tvProviders: [] 
            }));
        } else {
            // Clear providers if zipcode is invalid
            setAvailableProviders({});
        }
    };

    const handleTvProviderToggle = (providerId: string) => {
        setPreferences(prev => ({
            ...prev,
            tvProviders: prev.tvProviders.includes(providerId) 
                ? prev.tvProviders.filter(p => p !== providerId)
                : [...prev.tvProviders, providerId]
        }));
    };

    const handleTeamToggle = (team: Record<string, string>) => {
        setPreferences(prev => ({
            ...prev,
            favoriteTeams: prev.favoriteTeams.map(favoriteTeam => favoriteTeam.id).includes(team.id)
                ? prev.favoriteTeams.filter(t => t.id !== team.id)
                : [...prev.favoriteTeams, team]
        }));
    };

    const savePreferences = async () => {
        if (!currentUser) return;
        
        if (!preferences.zipcode || !isValidZipcode(preferences.zipcode)) {
            setZipcodeError('Please enter a valid 5-digit zipcode');
            return;
        }
        setSaveStatus('saving');
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, preferences);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Nav />
            <div className="pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mt-6">
                        <div className="relative">
                            {/* Sidebar Navigation - Fixed on left */}
                            <div className="fixed left-0 top-20 bottom-0 w-64 z-10">
                                <div className="h-full bg-white rounded-r-lg shadow overflow-hidden py-2">
                                    <nav className="flex flex-col h-full overflow-y-auto">
                                        {settingsSections.map((section) => (
                                            <button
                                                key={section.id}
                                                onClick={() => !section.disabled && scrollToSection(section.id)}
                                                className={`flex items-center px-4 py-3 text-left transition-colors ${
                                                    section.disabled 
                                                        ? 'text-gray-400 cursor-not-allowed' 
                                                        : activeSection === section.id
                                                            ? 'bg-slate-light/20 text-slate-deep border-l-4 border-slate-deep'
                                                            : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                                                }`}
                                                disabled={section.disabled}
                                            >
                                                <div className="mr-3">
                                                    {section.icon}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{section.title}</div>
                                                </div>
                                                {section.disabled && (
                                                    <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>

                            {/* Main Content - with left margin to accommodate fixed sidebar */}
                            <div className="ml-64 pl-8">
                                {loading ? (
                                    <div className="p-6 flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="px-6" ref={sectionsRef}>
                                        <SettingsSection
                                            id="account" 
                                            title="Account" 
                                            description="Manage your account information"
                                            icon={<User size={20} />}
                                        >
                                            <div className='text-lg'>
                                                {currentUser?.email}
                                            </div>
                                        </SettingsSection>

                                        <SettingsSection 
                                            id="location" 
                                            title="Location" 
                                            description="Set your location for regional sports information"
                                            icon={<MapPin size={20} />}
                                        >
                                            <ZipcodeInput 
                                                zipcode={preferences.zipcode} 
                                                onChange={handleZipcodeChange}
                                                error={zipcodeError}
                                            />
                                        </SettingsSection>
                                        
                                        <SettingsSection 
                                            id="providers" 
                                            title="TV Providers" 
                                            description="Select your TV providers to see available channels"
                                            icon={<Tv size={20} />}
                                        >
                                            <TvProviders 
                                                selectedProviders={preferences.tvProviders} 
                                                onToggle={handleTvProviderToggle}
                                                availableProviders={availableProviders}
                                                loading={providersLoading}
                                                hasValidZipcode={isValidZipcode(preferences.zipcode)}
                                            />
                                        </SettingsSection>
                                        
                                        <SettingsSection 
                                            id="teams" 
                                            title="Favorite Teams" 
                                            description="Select your favorite teams to get personalized recommendations"
                                            icon={<Star size={20} />}
                                        >
                                            <FavoriteTeams 
                                                selectedTeams={preferences.favoriteTeams} 
                                                onToggle={handleTeamToggle} 
                                            />
                                        </SettingsSection>

                                        <div className='py-6'>
                                            <SavePreferencesButton 
                                                onSave={savePreferences} 
                                                saveStatus={saveStatus} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;