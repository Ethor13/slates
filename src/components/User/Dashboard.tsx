import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp, SlidersHorizontal, Printer, Share2 } from 'lucide-react';
import Nav from '../General/Nav';
import Sidebar from '../Games/Sidebar';
import GamesList from '../Games/GamesList';
import GamePulseChart from '../Games/GamePulseChart';
import { Sports, adjustSlateScoreForLocation } from '../../helpers';

enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
    SPORT = 'Sport',
}

type ScheduleResponse = Record<string, any>;

// mark games as favorites
const addGameMetadata = (games: ScheduleResponse, favoriteTeams: Record<string, string>[], zipcode: string) => {
    const markedGames = { ...games };
    Object.keys(markedGames).forEach((sport) => {
        Object.entries(markedGames[sport]).forEach(([_, game]: [string, any]) => {
            // mark favorite teams
            game.isFavorite = favoriteTeams && favoriteTeams.length > 0 ?
                favoriteTeams.some((team) => (game.sport === team.sport) && (team.id === game.home.id || team.id === game.away.id)) :
                false;

            game.rawSlateScore = game.rawSlateScore ? game.rawSlateScore : game.slateScore;
            game.slateScore = adjustSlateScoreForLocation(game, zipcode);
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
    // Share notification state
    const [showLinkCopied, setShowLinkCopied] = useState<boolean>(false);

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

            setAllGames(addGameMetadata(games, userPreferences.favoriteTeams || [], userPreferences.zipcode));
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

    const handleShare = async () => {
        try {
            const response = await fetch(`/generateDashboardLink?userid=${currentUser!.uid.split(":").at(0)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            await navigator.clipboard.writeText(data.shareableUrl);

            // Show the "link copied" notification
            setShowLinkCopied(true);

            // Hide the notification after 2 seconds
            setTimeout(() => {
                setShowLinkCopied(false);
            }, 1500);
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    useEffect(() => { fetchAllGamesOnDate(); }, [fetchAllGamesOnDate]);
    useEffect(() => { setDisplayedGames(); }, [setDisplayedGames]);

    useEffect(() => {
        if (Object.keys(allGames).length > 0 && !preferencesLoading) {
            setAllGames(addGameMetadata(allGames, userPreferences.favoriteTeams || [], userPreferences.zipcode));
        }
    }, [userPreferences.favoriteTeams, userPreferences.zipcode, preferencesLoading]);

    return (
        <div className="h-screen print:h-auto overflow-hidden print:overflow-visible relative slate-gradient">
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

            <div className="h-screen print:h-auto bg-transparent print:bg-white pt-20 print:pt-0 overflow-hidden print:overflow-visible">
                <main className="h-full print:h-auto">
                    <div className="flex flex-row h-full print:h-auto">
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
                        <div id="game-content" className={`w-full md:ml-[15rem] print:ml-0 h-[calc(100vh-5rem)] print:h-auto overflow-y-auto print:overflow-visible bg-white hide-scrollbar relative md:rounded-tl-xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-full' : 'translate-x-0'} md:transform-none print-container`}>
                            {gamesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : gamesError ? (
                                <div className="text-center p-4 mt-8 text-lg bg-red-100 text-red-600 rounded-lg">
                                    Error loading games: {gamesError.message || 'Unknown error'}
                                </div>
                            ) : (
                                <div className="w-full px-[3vw] pt-[1rem] print:pt-0">
                                    {/* Unified Control Bar */}
                                    <div className="w-full h-full flex justify-center print:hidden relative">
                                        <div className="slate-gradient rounded-full px-6 py-2 flex items-center gap-2">
                                            {/* Filters button - only show on mobile */}
                                            <div className='w-[6rem] md:hidden'>
                                                <button
                                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                                    className="w-full flex gap-2 justify-center items-center p-2 rounded-full transition-all duration-200 text-white hover:bg-white/10"
                                                    aria-label="Toggle sidebar"
                                                >
                                                    <SlidersHorizontal className="h-5 w-5" />
                                                    <span className="text-lg font-medium">Filters</span>
                                                </button>
                                            </div>

                                            {/* Conditional divider - only show on mobile after filters */}
                                            <div className="w-px h-6 bg-white/20 mx-1 md:hidden"></div>

                                            {/* Print button */}
                                            <div className='w-[6rem]'>
                                                <button
                                                    onClick={handlePrint}
                                                    className="w-full flex gap-2 justify-center items-center p-2 rounded-full transition-all duration-200 text-white hover:bg-white/10"
                                                    aria-label="Print this page"
                                                >
                                                    <Printer className="h-5 w-5" />
                                                    <span className="text-lg font-medium">Print</span>
                                                </button>
                                            </div>


                                            {/* Divider between Print and Share */}
                                            <div className="w-px h-6 bg-white/20 mx-1"></div>

                                            {/* Share button */}
                                            <div className='w-[6rem]'>
                                                <button
                                                    onClick={handleShare}
                                                    className="w-full flex gap-2 justify-center items-center p-2 rounded-full transition-all duration-200 text-white hover:bg-white/10"
                                                    aria-label="Share this page"
                                                >
                                                    <Share2 className="h-5 w-5" />
                                                    <span className="text-lg font-medium">Share</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Link Copied Notification */}
                                        <div className={`absolute text-md top-full mt-2 slate-gradient text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${showLinkCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                                            }`}>
                                            Link Copied!
                                        </div>
                                    </div>

                                    {/* Conditionally render GamePulseChart in print based on toggle */}
                                    <div className={`hidden mt-6 md:block ${includeGamePulseInPrint ? '' : 'print:hidden'}`}>
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