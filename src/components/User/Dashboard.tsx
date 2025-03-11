import { storage } from '../../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Nav from '../Nav';
import GamesList from '../Games/GamesList';
import SportSelector from '../Games/SportSelector';

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
            const scheduleRef = ref(storage, `sports/all/schedule/${date}.json`);
            const downloadUrl = await getDownloadURL(scheduleRef)
            const res = await fetch(downloadUrl);

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const games = await res.json();

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

    useEffect(() => { fetchAllGamesOnDate(); }, [fetchAllGamesOnDate]);
    useEffect(() => { setDisplayedGames(); }, [setDisplayedGames]);

    return (
        <div className="min-h-screen bg-white">
            <Nav />
            <div className="min-h-screen bg-gray-50 pt-16">
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg mb-6 p-4">
                        <SportSelector props={{
                            selectedSports,
                            setSelectedSports,
                            selectedDate,
                            setSelectedDate,
                            sortBy,
                            setSortBy
                        }} />

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
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Dashboard;