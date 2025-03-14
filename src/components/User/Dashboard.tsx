import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp } from 'lucide-react';
import Nav from '../Nav';
import GamesList from '../Games/GamesList';
import Sidebar from '../Games/Sidebar';

enum Sports {
    NBA = 'nba',
    NCAAMBB = 'ncaambb',
}

enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
}

type ScheduleResponse = Record<string, any>;

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [allGames, setAllGames] = useState<ScheduleResponse>({});
    const [games, setGames] = useState<ScheduleResponse>({});
    const [gamesLoading, setGamesLoading] = useState<boolean>(false);
    const [gamesError, setGamesError] = useState<any | null>(null);
    const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);

    // Game state for SportSelector and GamesList
    const [selectedSports, setSelectedSports] = useState<Sports[]>(Object.values(Sports));
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sortBy, setSortBy] = useState<Sort>(Sort.SCORE);

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

            setAllGames(games);
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

    useEffect(() => { fetchAllGamesOnDate(); }, [fetchAllGamesOnDate]);
    useEffect(() => { setDisplayedGames(); }, [setDisplayedGames]);

    return (
        <div className="min-h-screen bg-white relative">
            <Nav />
            <div className="min-h-screen bg-gray-50 pt-20">
                <main className="mx-auto">
                    <div className="flex flex-row h-full">
                        {/* Left sidebar with fixed width */}
                        <Sidebar
                            props={{
                                selectedSports,
                                setSelectedSports,
                                selectedDate,
                                setSelectedDate,
                                setGamesLoading
                            }}
                        />
                        {/* Main content area that takes remaining space and centers content */}
                        <div className="w-full flex justify-center ml-[20vw] overflow-y-visible">
                            {gamesLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                </div>
                            ) : gamesError ? (
                                <div className="text-center p-4 mt-8 text-lg bg-red-100 text-red-600 rounded-lg">
                                    Error loading games: {gamesError.message || 'Unknown error'}
                                </div>
                            ) : (
                                <GamesList
                                    games={games}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    selectedDate={selectedDate}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
            <button
                onClick={scrollToTop}
                className={`fixed top-24 right-8 bg-gray-400 hover:bg-slate-deep text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${showScrollToTop ? 'opacity-100' : 'opacity-0'}`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="h-6 w-6" />
            </button>
        </div>
    );
}

export default Dashboard;