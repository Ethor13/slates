import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { NotificationRecipient } from '../../contexts/AuthContext';
import Nav from '../General/Nav';
import { ZipcodeInput, TimezoneSelector, TvProviders, FavoriteTeams, NotificationEmails, Subscription, StateSelector } from './Preferences';
import { MapPin, Tv, Star, User, Bell, Trophy } from 'lucide-react';

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
    const [providersLoading, setProvidersLoading] = useState(false);
    const [zipcode, setZipcode] = useState(userPreferences.zipcode);
    const [timezone, setTimezone] = useState(userPreferences.timezone);
    const [firstName, setFirstName] = useState(userPreferences.firstName || '');
    const [lastName, setLastName] = useState(userPreferences.lastName || '');
    const [venueName, setVenueName] = useState(userPreferences.venueName || '');
    const [role, setRole] = useState((userPreferences as any).role || '');
    const [venueAddress, setVenueAddress] = useState(userPreferences.venueAddress || '');
    const [venueState, setVenueState] = useState(userPreferences.venueState || '');
    const [availableProviders, setAvailableProviders] = useState<Record<string, any>>({});
    const [activeSection, setActiveSection] = useState('location');
    const sectionsRef = useRef<HTMLDivElement>(null);

    

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
        if (isValidZipcode(zipcode)) {
            fetchProviders(zipcode);
        }
    }, [zipcode]);

    // Sync local state with userPreferences when they change
    useEffect(() => {
        setZipcode(userPreferences.zipcode);
        setTimezone(userPreferences.timezone);
        setFirstName(userPreferences.firstName || '');
        setLastName(userPreferences.lastName || '');
        setVenueName(userPreferences.venueName || '');
        setVenueAddress(userPreferences.venueAddress || '');
        setVenueState(userPreferences.venueState || '');
    setRole((userPreferences as any).role || '');
    }, [
        userPreferences.zipcode,
        userPreferences.timezone,
        userPreferences.firstName,
        userPreferences.lastName,
        userPreferences.venueName,
    userPreferences.venueAddress
    ]);

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

    const handleZipcodeChange = useCallback(async (zipcode: string) => {
        try {
            setZipcode(zipcode);
            if (isValidZipcode(zipcode)) {
                fetchProviders(zipcode);
                await updateUserPreferences({ tvProviders: '', zipcode });
            } else {
                setAvailableProviders({});
            }
        } catch (error) {
            console.error('Error saving zipcode:', error);
        }
    }, [updateUserPreferences, fetchProviders, setAvailableProviders]);

    const handleTimezoneChange = useCallback(async (timezone: string) => {
        try {
            setTimezone(timezone);
            await updateUserPreferences({ timezone });
        } catch (error) {
            console.error('Error saving timezone:', error);
        }
    }, [updateUserPreferences]);

    const handleAccountFieldBlur = async (field: 'firstName' | 'lastName' | 'venueName' | 'role', value: string) => {
        try {
            await updateUserPreferences({ [field]: value } as any);
        } catch (error) {
            console.error(`Error saving ${field}:`, error);
        }
    };

    const handleVenueAddressBlur = async (value: string) => {
        try {
            await updateUserPreferences({ venueAddress: value });
        } catch (error) {
            console.error('Error saving venue address:', error);
        }
    };

    const handleVenueStateBlur = async (value: string) => {
        try {
            await updateUserPreferences({ venueState: value.toUpperCase() });
        } catch (error) {
            console.error('Error saving venue state:', error);
        }
    };

    const handleTvProviderSelect = async (providerId: string) => {
        try {
            await updateUserPreferences({ tvProviders: providerId });
        } catch (error) {
            console.error('Error saving TV provider:', error);
        }
    };

    const handleTeamToggle = async (team: Record<string, string>) => {
        try {
            const isAlreadyFavorite = userPreferences.favoriteTeams.some(
                favoriteTeam => favoriteTeam.id === team.id && favoriteTeam.sport === team.sport
            );

            const newFavoriteTeams = isAlreadyFavorite
                ? userPreferences.favoriteTeams.filter(t => !(t.id === team.id && t.sport === team.sport))
                : [...userPreferences.favoriteTeams, team];

            await updateUserPreferences({ favoriteTeams: newFavoriteTeams });
        } catch (error) {
            console.error('Error saving favorite teams:', error);
        }
    };

    const handleNotificationEmailsChange = async (emails: NotificationRecipient[]) => {
        try {
            await updateUserPreferences({ notificationEmails: emails });
        } catch (error) {
            console.error('Error saving notification emails:', error);
        }
    };

    const settingsSections = [
        { id: 'account', title: 'Account', description: 'Manage your account information', icon: <User size={20} /> },
        { id: 'subscription', title: 'Subscription', description: 'View and manage your plan', icon: <Trophy size={20} /> },
        { id: 'location', title: 'Location', description: 'Set your location for regional sports', icon: <MapPin size={20} /> },
        { id: 'providers', title: 'TV Providers', description: 'Choose your TV providers for channel recommendations', icon: <Tv size={20} /> },
        { id: 'notifications', title: 'Notifications', description: 'Configure daily email notifications with your personalized dashboard', icon: <Bell size={20} /> },
        { id: 'teams', title: 'Favorite Teams', description: 'Select your favorite teams to prioritize their games', icon: <Star size={20} /> },
    ];

    return (
        <div className="h-screen overflow-hidden relative slate-gradient">
            <Nav fixed />

            <div className="h-full bg-transparent overflow-hidden pt-20">
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
                                                        onClick={() => scrollToSection(section.id)}
                                                        className={`flex items-center px-3 py-1.5 text-left transition-colors rounded-lg ${activeSection === section.id
                                                            ? 'bg-white/20 text-white'
                                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                            }`}
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
                                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 mt-3 mb-6" ref={sectionsRef}>
                                    <SettingsSection
                                        id="account"
                                        title="Account"
                                        description="Manage your account information"
                                        icon={<User size={20} />}
                                    >
                                        <div className='space-y-4'>
                                            <div>
                                                <div className='text-sm font-medium'>Email</div>
                                                <div className='text-sm'>{currentUser?.email}</div>
                                            </div>
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium">First name</label>
                                                    <div className="mt-1">
                                                        <input
                                                            className="px-3 py-1.5 w-50 text-sm bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                                                            value={firstName}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            onBlur={(e) => handleAccountFieldBlur('firstName', e.target.value)}
                                                            placeholder="Jane"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Last name</label>
                                                    <div className="mt-1">
                                                        <input
                                                            className="px-3 py-1.5 w-50 text-sm bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                                                            value={lastName}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            onBlur={(e) => handleAccountFieldBlur('lastName', e.target.value)}
                                                            placeholder="Doe"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Venue</label>
                                                    <div className="mt-1">
                                                        <input
                                                            className="px-3 py-1.5 w-50 text-sm bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                                                            value={venueName}
                                                            onChange={(e) => setVenueName(e.target.value)}
                                                            onBlur={(e) => handleAccountFieldBlur('venueName', e.target.value)}
                                                            placeholder="My Sports Bar"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium">Role</label>
                                                    <div className="mt-1">
                                                        <input
                                                            className="px-3 py-1.5 w-50 text-sm bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                                                            value={role}
                                                            onChange={(e) => setRole(e.target.value)}
                                                            onBlur={(e) => handleAccountFieldBlur('role', e.target.value)}
                                                            placeholder="e.g., Owner, Manager"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        id="subscription"
                                        title="Subscription"
                                        description="View your current plan and manage billing"
                                        icon={<Trophy size={20} />}
                                    >
                                        <Subscription />
                                    </SettingsSection>

                                    <SettingsSection
                                        id="location"
                                        title="Location"
                                        description="Set your location for regional sports information"
                                        icon={<MapPin size={20} />}
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium">Street Address</label>
                                                <div className="mt-1">
                                                    <input
                                                        className="px-3 py-1.5 w-[20rem] text-sm bg-transparent shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block border border-gray-300 rounded-md selection:bg-blue-100"
                                                        value={venueAddress}
                                                        onChange={(e) => setVenueAddress(e.target.value)}
                                                        onBlur={(e) => handleVenueAddressBlur(e.target.value)}
                                                        placeholder="123 Main St, Suite 100"
                                                    />
                                                </div>
                                            </div>
                                            <StateSelector
                                                value={venueState}
                                                onChange={setVenueState}
                                                onBlur={(v) => handleVenueStateBlur(v)}
                                            />
                                            <ZipcodeInput
                                                zipcode={zipcode}
                                                onChange={handleZipcodeChange}
                                            />
                                            <TimezoneSelector
                                                timezone={timezone}
                                                onChange={handleTimezoneChange}
                                            />
                                        </div>
                                    </SettingsSection>

                                    <SettingsSection
                                        id="providers"
                                        title="TV Provider"
                                        description="Select your TV provider to see available channels"
                                        icon={<Tv size={20} />}
                                    >
                                        <TvProviders
                                            selectedProviders={userPreferences.tvProviders}
                                            onSelect={handleTvProviderSelect}
                                            availableProviders={availableProviders}
                                            loading={providersLoading}
                                            hasValidZipcode={isValidZipcode(userPreferences.zipcode)}
                                        />
                                    </SettingsSection>

                                    <SettingsSection
                                        id="notifications"
                                        title="Notification Emails"
                                        description="Manage your notification email preferences"
                                        icon={<Bell size={20} />}
                                    >
                                        <NotificationEmails
                                            notificationEmails={userPreferences.notificationEmails}
                                            onChange={handleNotificationEmailsChange}
                                        />
                                    </SettingsSection>

                                    <SettingsSection
                                        id="teams"
                                        title="Favorite Teams"
                                        description="Select your favorite teams to get personalized recommendations"
                                        icon={<Star size={20} />}
                                    >
                                        <FavoriteTeams
                                            selectedTeams={userPreferences.favoriteTeams}
                                            onToggle={handleTeamToggle}
                                        />
                                    </SettingsSection>
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