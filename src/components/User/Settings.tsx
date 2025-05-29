import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Nav from '../General/Nav';
import { 
    ZipcodeInput, 
    TvProviders, 
    FavoriteTeams, 
    SavePreferencesButton 
} from './Preferences';
import { MapPin, Tv, Star, User, Bell, Shield, HelpCircle } from 'lucide-react';

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
            className={`scroll-mt-20 py-4 xl:py-5 border-b border-gray-200`}
        >
            <div className="flex flex-row mb-3 xl:mb-4 items-start gap-2">
                <div className="p-2 rounded-full slate-gradient text-white">
                    {icon}
                </div>
                <div className="w-full">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 leading-[18px]">{title}</h2>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <div className="pt-2 w-full">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Settings = () => {
    const { currentUser, userPreferences, preferencesLoading, updateUserPreferences } = useAuth();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [zipcodeError, setZipcodeError] = useState<string | null>(null);
    const [providersLoading, setProvidersLoading] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<Record<string, any>>({});
    const [activeSection, setActiveSection] = useState('location');
    const sectionsRef = useRef<HTMLDivElement>(null);
    
    // Local copy of preferences that will be updated as the user makes changes
    const [localPreferences, setLocalPreferences] = useState({ ...userPreferences });

    // Update local preferences when userPreferences from context changes
    useEffect(() => {
        setLocalPreferences({ ...userPreferences });
    }, [userPreferences]);

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
    }, [preferencesLoading]);

    // If the user has a valid zipcode, fetch providers on component mount
    useEffect(() => {
        if (isValidZipcode(userPreferences.zipcode)) {
            fetchProviders(userPreferences.zipcode);
        }
    }, [userPreferences.zipcode]);

    const scrollToSection = (sectionId: string) => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    const isValidZipcode = (zipcode: string) => zipcode.length === 5;

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
        setLocalPreferences(prev => ({
            ...prev,
            zipcode
        }));
        
        // If zipcode becomes valid, fetch providers
        if (isValidZipcode(zipcode)) {
            fetchProviders(zipcode);
            setLocalPreferences(prev => ({
                ...prev,
                tvProviders: {} // Changed from [] to {} for map structure
            }));
        } else {
            // Clear providers if zipcode is invalid
            setAvailableProviders({});
        }
    };

    const handleTvProviderToggle = (providerId: string, providerName: string) => {
        setLocalPreferences(prev => {
            const newProviders = { ...prev.tvProviders };
            
            if (providerId in newProviders) {
                // Remove provider if it already exists
                delete newProviders[providerId];
            } else {
                // Add provider with name if it doesn't exist
                newProviders[providerId] = providerName;
            }
            
            return {
                ...prev,
                tvProviders: newProviders
            };
        });
    };

    const handleTeamToggle = (team: Record<string, string>) => {
        setLocalPreferences(prev => ({
            ...prev,
            favoriteTeams: prev.favoriteTeams.map(favoriteTeam => favoriteTeam.id).includes(team.id)
                ? prev.favoriteTeams.filter(t => t.id !== team.id)
                : [...prev.favoriteTeams, team]
        }));
    };

    const savePreferences = async () => {
        if (!currentUser) return;
        
        if (!localPreferences.zipcode || !isValidZipcode(localPreferences.zipcode)) {
            setZipcodeError('Please enter a valid 5-digit zipcode');
            return;
        }
        
        setSaveStatus('saving');
        try {
            await updateUserPreferences(localPreferences);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const settingsSections = [
        { id: 'account', title: 'Account', description: 'Manage your account information', icon: <User size={20} /> },
        { id: 'location', title: 'Location', description: 'Set your location for regional sports', icon: <MapPin size={20} /> },
        { id: 'providers', title: 'TV Providers', description: 'Choose your TV providers for channel recommendations', icon: <Tv size={20} /> },
        { id: 'teams', title: 'Favorite Teams', description: 'Select your favorite teams to prioritize their games', icon: <Star size={20} /> },
        { id: 'notifications', title: 'Notifications', description: 'Configure how you receive notifications', icon: <Bell size={20} />, disabled: true },
        { id: 'privacy', title: 'Privacy', description: 'Control your privacy settings', icon: <Shield size={20} />, disabled: true },
        { id: 'help', title: 'Help & Support', description: 'Get assistance with Slates', icon: <HelpCircle size={20} />, disabled: true }
    ];

    return (
        <div className="h-screen overflow-hidden relative slate-gradient">
            <Nav />
            
            <div className="h-screen bg-transparent pt-20 overflow-hidden">
                <main className="h-full">
                    <div className="flex flex-row h-full">
                        {/* Left sidebar - hidden on mobile */}
                        <div className={`hidden sm:block fixed left-0 top-20 bottom-0 w-full md:w-[15rem] z-40 transform transition-transform duration-300 ease-in-out translate-x-0 bg-transparent`}>
                            <div className="flex flex-col h-full bg-transparent">
                                <div className="flex-1 overflow-y-auto text-white hide-scrollbar bg-transparent">
                                    <div className="px-4 flex flex-col gap-3 bg-transparent">
                                        <div className="flex flex-col gap-3 mt-3">
                                            <h2 className="font-semibold text-lg md:text-base">Settings</h2>
                                            <nav className="flex flex-col gap-1 bg-transparent">
                                                {settingsSections.map((section) => (
                                                    <button
                                                        key={section.id}
                                                        onClick={() => !section.disabled && scrollToSection(section.id)}
                                                        className={`flex items-center px-3 py-1.5 text-left transition-colors rounded-lg ${
                                                            section.disabled 
                                                                ? 'text-white/40 cursor-not-allowed' 
                                                                : activeSection === section.id
                                                                    ? 'bg-white/20 text-white'
                                                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                        disabled={section.disabled}
                                                    >
                                                        <div className="mr-2.5">
                                                            {section.icon}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-base md:text-sm">{section.title}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main content area */}
                        <div className={`w-full sm:ml-[15rem] h-[calc(100vh-5rem)] overflow-y-auto bg-white hide-scrollbar relative sm:rounded-tl-xl transform transition-transform duration-300 ease-in-out translate-x-0`}>
                            {preferencesLoading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-deep"></div>
                                </div>
                            ) : (
                                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mt-3" ref={sectionsRef}>
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
                                            zipcode={localPreferences.zipcode} 
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
                                            selectedProviders={localPreferences.tvProviders} 
                                            onToggle={handleTvProviderToggle}
                                            availableProviders={availableProviders}
                                            loading={providersLoading}
                                            hasValidZipcode={isValidZipcode(localPreferences.zipcode)}
                                        />
                                    </SettingsSection>
                                    
                                    <SettingsSection 
                                        id="teams" 
                                        title="Favorite Teams" 
                                        description="Select your favorite teams to get personalized recommendations"
                                        icon={<Star size={20} />}
                                    >
                                        <FavoriteTeams 
                                            selectedTeams={localPreferences.favoriteTeams} 
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
                </main>
            </div>
        </div>
    );
};

export default Settings;