import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Nav from '../Nav';
import GamesList from '../Games/GamesList';
import SportSelector from '../Games/SportSelector';

enum Sport {
    NBA = 'nba',
    NCAAMBB = 'ncaambb',
}

enum Sort {
    TIME = 'Time',
    SCORE = 'Slate Score',
}

interface ScheduleResponse {
    [x: string]: any;
}

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [games, setGames] = useState<ScheduleResponse>({});
    const [gamesLoading, setGamesLoading] = useState<boolean>(false);
    const [gamesError, setGamesError] = useState<any | null>(null);
    
    // Game state for SportSelector and GamesList
    const [selectedSports, setSelectedSports] = useState<Sport[]>(Object.values(Sport));
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [sortBy, setSortBy] = useState<Sort>(Sort.SCORE);

    // Fetch games data using Cloud Functions
    const fetchGamesData = async () => {
        if (!currentUser) return;
        
        setGamesLoading(true);
        setGamesError(null);

        if (selectedSports.length === 0) {
            setGamesLoading(false);
            setGames({});
            return;
        }
        
        try {
            const formattedDate = selectedDate.toLocaleDateString('en-CA').replace(/-/g, '');
            const url = "/schedule?date=" + formattedDate + "&sports=" + selectedSports.sort().join(',');
            const result = await fetch(url)
            const jsonResult = await result.json();
            setGames(jsonResult);
        } catch (error) {
            console.error('Error calling Cloud Function:', error);
            setGamesError(error);
        } finally {
            setGamesLoading(false);
        }
    };

    // Clear games data and set loading state first, then fetch new data when selections change
    useEffect(() => {
        setGames({});
        setGamesLoading(true);
        fetchGamesData();
    }, [currentUser, selectedDate, selectedSports]);

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
                            setSortBy,
                            fetchGamesData,
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