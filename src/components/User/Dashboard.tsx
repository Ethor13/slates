import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp, Menu, Printer } from 'lucide-react';
import Nav from '../General/Nav';
import Sidebar from '../Games/Sidebar';
import GamesList from '../Games/GamesList';
import GamePulseChart from '../Games/GamePulseChart';
import { Sports } from '../../helpers';

enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
    SPORT = 'Sport',
}

type ScheduleResponse = Record<string, any>;

// mark games as favorites
const markFavoriteTeams = (games: ScheduleResponse, favoriteTeams: Record<string, string>[]) => {
    const markedGames = { ...games };
    Object.keys(markedGames).forEach((sport) => {
        Object.entries(markedGames[sport]).forEach(([_, game]: [string, any]) => {
            game.isFavorite = favoriteTeams.some((team) => (game.sport === team.sport) && (team.id === game.home.id || team.id === game.away.id));
        });
    });
    return markedGames;
}

const Dashboard = () => {
    const { currentUser, userPreferences } = useAuth();
    const [allGames, setAllGames] = useState<ScheduleResponse>({});
    const [games, setGames] = useState<ScheduleResponse>({});
    const [gamesLoading, setGamesLoading] = useState<boolean>(false);
    const [gamesError, setGamesError] = useState<any | null>(null);
    const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    // Print settings state
    const [includeGamePulseInPrint, setIncludeGamePulseInPrint] = useState<boolean>(true);

    // Game state for SportSelector and GamesList
    const [selectedSports, setSelectedSports] = useState<Sports[]>(Object.values(Sports));
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sortBy, setSortBy] = useState<Sort>(Sort.SCORE);
    const [secondarySort, setSecondarySort] = useState<Sort>(Sort.TIME); // Default to TIME

    // Fetch games data using Cloud Functions
    const fetchAllGamesOnDate = useCallback(async () => {
        if (!currentUser) return;

        setGamesLoading(true);
        setGamesError(null);

        try {
            const date = selectedDate.toLocaleDateString('en-CA').replace(/-/g, '');
            const scheduleRef = doc(db, 'sports/all/schedule', date);
            const scheduleSnapshot = await getDoc(scheduleRef);
            if (!scheduleSnapshot.exists()) {
                throw new Error('No schedule found for the selected date');
            }
            const games = scheduleSnapshot.data() as ScheduleResponse;

            setAllGames(markFavoriteTeams(games, userPreferences.favoriteTeams));
        } catch (error) {
            console.error('Error getting games', error);
            setGamesError(error);
        } finally {
            setGamesLoading(false);
        }
    }, [currentUser, selectedDate]);

    const setDisplayedGames = useCallback(() => {
        setGamesLoading(true);
        setGamesError(null);
        try {
            const filteredGames = Object.values(selectedSports).reduce((acc, sport) => ({
                ...acc,
                ...allGames[sport]
            }), {} as ScheduleResponse);

            setGames(filteredGames);
        } catch (error) {
            console.error('Error setting displayed games:', error);
            setGamesError(error);
        } finally {
            setGamesLoading(false);
        }
    }, [allGames, selectedSports]);

    // Helper to ensure secondary sort is always different from primary
    const handleSetSortBy = (newSort: Sort) => {
        setSortBy(newSort);
        if (secondarySort === newSort) {
            // Pick the first available sort that isn't the new primary
            const available = Object.values(Sort).filter(s => s !== newSort);
            setSecondarySort(available[0]);
        }
    };

    // Handle scroll event to show/hide scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            // Show button when user scrolls down 300px
            setShowScrollToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Function to handle print
    const handlePrint = () => {
        window.print();
    };

    useEffect(() => { fetchAllGamesOnDate(); }, [fetchAllGamesOnDate]);
    useEffect(() => { setDisplayedGames(); }, [setDisplayedGames]);

    return (
        <div className="min-h-screen bg-white relative">
            <div className="print:hidden">
                <Nav />
            </div>
            <div className="min-h-screen bg-gray-50 print:bg-white pt-20 print:pt-0">
                <main>
                    <div className="flex flex-row h-full">
                        {/* Mobile menu toggle button */}
                        <button
                            className={`md:hidden fixed top-24 left-4 z-50 bg-white p-2 rounded-md shadow-md transition-opacity duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} print:hidden`}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>

                        {/* Left sidebar */}
                        <div className="print:hidden">
                            <Sidebar
                                props={{
                                    selectedSports,
                                    setSelectedSports,
                                    selectedDate,
                                    setSelectedDate,
                                    setGamesLoading,
                                    sidebarOpen,
                                    setSidebarOpen,
                                    includeGamePulseInPrint,
                                    setIncludeGamePulseInPrint
                                }}
                            />
                        </div>

                        {/* Main content area that takes remaining space and centers content */}
                        {/* This needs to be same padding as sidebar width */}
                        <div className="w-full md:ml-[15rem] print:ml-0 overflow-y-visible">
                            {gamesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : gamesError ? (
                                <div className="text-center p-4 mt-8 text-lg bg-red-100 text-red-600 rounded-lg">
                                    Error loading games: {gamesError.message || 'Unknown error'}
                                </div>
                            ) : (
                                <div className="w-full px-[3vw]">
                                    {/* Conditionally render GamePulseChart in print based on toggle */}
                                    <div className={includeGamePulseInPrint ? '' : 'print:hidden'}>
                                        <GamePulseChart games={games} />
                                    </div>
                                    <GamesList
                                        games={games}
                                        sortBy={sortBy}
                                        setSortBy={handleSetSortBy}
                                        secondarySort={secondarySort}
                                        setSecondarySort={setSecondarySort}
                                        selectedDate={selectedDate}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <button
                onClick={scrollToTop}
                className={`fixed top-24 right-[2vw] bg-gray-400 hover:bg-slate-deep text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${!sidebarOpen && showScrollToTop ? 'opacity-100' : 'opacity-0 hidden'}`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-6 w-6" />
            </button>
            <button
                onClick={handlePrint}
                className="absolute top-24 right-[2vw] bg-slate-medium hover:bg-slate-deep text-white p-3 rounded-full shadow-lg transition-all duration-300 print:hidden"
                aria-label="Print this page"
            >
                <Printer className="h-6 w-6" />
            </button>
        </div>
    );
}

export default Dashboard;