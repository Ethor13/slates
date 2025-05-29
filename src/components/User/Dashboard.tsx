import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp, SlidersHorizontal, Printer } from 'lucide-react';
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
            game.isFavorite = favoriteTeams && favoriteTeams.length > 0 ? 
                favoriteTeams.some((team) => (game.sport === team.sport) && (team.id === game.home.id || team.id === game.away.id)) :
                false;
        });
    });
    return markedGames;
}

const Dashboard = () => {
    const { currentUser, userPreferences, preferencesLoading } = useAuth();
    const [allGames, setAllGames] = useState<ScheduleResponse>({});
    const [games, setGames] = useState<ScheduleResponse>({});
    const [gamesLoading, setGamesLoading] = useState<boolean>(false);
    const [gamesError, setGamesError] = useState<any | null>(null);
    const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    // Print settings state
    const [includeGamePulseInPrint, setIncludeGamePulseInPrint] = useState<boolean>(false);

    // Game state for SportSelector and GamesList
    const [selectedSports, setSelectedSports] = useState<Sports[]>(Object.values(Sports));
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sortBy, setSortBy] = useState<Sort>(Sort.SCORE);
    const [secondarySort, setSecondarySort] = useState<Sort>(Sort.TIME); // Default to TIME

    // Fetch games data using Cloud Functions
    const fetchAllGamesOnDate = useCallback(async () => {
        if (!currentUser || preferencesLoading) return;

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
    }, [currentUser, selectedDate, userPreferences.favoriteTeams, preferencesLoading]);

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
            const gameContentDiv = document.getElementById('game-content');
            if (gameContentDiv) {
                // Show button when user scrolls down 300px within the game-content div
                setShowScrollToTop(gameContentDiv.scrollTop > 300);
            }
        };

        const gameContentDiv = document.getElementById('game-content');
        if (gameContentDiv) {
            gameContentDiv.addEventListener('scroll', handleScroll);
            return () => gameContentDiv.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        const gameContentDiv = document.getElementById('game-content');
        if (gameContentDiv) {
            gameContentDiv.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Function to handle print
    const handlePrint = () => {
        window.print();
    };

    useEffect(() => { fetchAllGamesOnDate(); }, [fetchAllGamesOnDate]);
    useEffect(() => { setDisplayedGames(); }, [setDisplayedGames]);

    // Re-mark favorite teams when user preferences change
    useEffect(() => {
        if (Object.keys(allGames).length > 0 && !preferencesLoading) {
            setAllGames(prevGames => markFavoriteTeams(prevGames, userPreferences.favoriteTeams));
        }
    }, [userPreferences.favoriteTeams, preferencesLoading]);

    return (
        <div className="h-screen overflow-hidden relative slate-gradient">
            <div className="print:hidden">
                <Nav />
            </div>
            
            {/* Print Header Banner */}
            <div className="hidden h-[4rem] w-full bg-slate-light/20 px-3 py-3 print:flex items-center text-white">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                        <img 
                            src="/assets/logos/slates_white_outline.svg" 
                            alt="Slates Logo" 
                            className="h-8 sm:h-10 xl:h-12 w-auto"
                        />
                        <div className="pl-1">
                            <h1 className="text-lg sm:text-xl xl:text-2xl font-bold">Slates</h1>
                            <p className="text-xs sm:text-sm">www.slates.co</p>
                        </div>
                    </div>
                    <div className="text-right text-xs sm:text-sm">
                        <p>
                            Games for <b>{selectedDate.toLocaleDateString("en-CA", {
                                month: 'long',
                                weekday: 'long',
                                day: 'numeric'
                            })}</b>
                        </p>
                        <div className='hidden print:block text-sm'>
                            Sorted by <b>{sortBy}</b> then by <b>{secondarySort}</b>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="h-screen bg-transparent print:bg-white pt-20 print:pt-0 overflow-hidden">
                <main className="h-full">
                    <div className="flex flex-row h-full">
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
                        <div id="game-content" className={`w-full md:ml-[15rem] print:ml-0 h-[calc(100vh-5rem)] overflow-y-auto bg-white hide-scrollbar relative sm:rounded-tl-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-full' : 'translate-x-0'} md:transform-none`}>
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
                                    {/* Mobile menu toggle button */}
                                    <button
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                        id="mobile-menu-toggle"
                                        className={`flex gap-2 slate-gradient absolute sm:hidden top-6 left-[3vw] p-2 rounded-full transition-all duration-200 text-white print:hidden z-30`}
                                        aria-label="Toggle sidebar"
                                    >
                                        <p><b>Filters</b></p>
                                        <SlidersHorizontal className="h-6 w-6" />
                                    </button>
                                    {/* Print button - positioned inside scrollable area */}
                                    <button
                                        onClick={handlePrint}
                                        className="absolute top-6 right-[3vw] p-2 rounded-full transition-all duration-200 text-white slate-gradient slate-gradient-hover print:hidden z-30
                                                   flex gap-2"
                                        aria-label="Print this page"
                                    >
                                        <p><b>Print</b></p>
                                        <Printer className="h-6 w-6" />
                                    </button>
                                    
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
                className={`slate-gradient slate-gradient-hover text-white fixed top-24 right-4 p-2 rounded-full transition-all duration-200 z-40 ${!sidebarOpen && showScrollToTop ? 'opacity-100' : 'opacity-0 hidden'}`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-6 w-6" strokeWidth={3} />
            </button>
        </div>
    );
}

export default Dashboard;