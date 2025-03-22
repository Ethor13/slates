import React, { useState, useEffect } from 'react';
import { GameCardProps, Sort } from '../types';
import RefinedGameCard from './MinimalGameCard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import Nav from '../../General/Nav';

const DemoPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [games, setGames] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any | null>(null);
  
  // Fetch sample games data to demonstrate the card
  useEffect(() => {
    const fetchSampleGames = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Using today's date or a sample date
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-CA').replace(/-/g, '');
        
        // Try to get games from the database
        const scheduleRef = doc(db, 'sports/all/schedule', dateStr);
        const scheduleSnapshot = await getDoc(scheduleRef);
        
        if (scheduleSnapshot.exists()) {
          const gamesData = scheduleSnapshot.data();
          
          // Combine all sports into one object
          const allGames = Object.values(gamesData).reduce((acc, sport) => ({
            ...acc,
            ...(sport as Record<string, any>)
          }), {});
          
          setGames(allGames);
        } else {
          setError(new Error('No games found for today'));
        }
      } catch (error) {
        console.error('Error fetching games', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSampleGames();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="min-h-screen bg-gray-50 pt-20">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Refined GameCard Demo</h1>
            <p className="text-gray-600">A more compact and efficient game card design</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Features:</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>More horizontal layout that's less tall and takes up less vertical space</li>
              <li>Broadcasts displayed inline to the right</li>
              <li>Consistent spacing with centered @ symbol</li>
              <li>Game notes available by clicking on the card</li>
              <li>Maintains all the original information in a more compact design</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center p-4 bg-red-100 text-red-600 rounded-lg">
                Error loading games: {error.message || 'Unknown error'}
              </div>
            ) : Object.keys(games).length > 0 ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900">Today's Games</h2>
                {Object.entries(games)
                  .sort((game1, game2) => game2[1].slateScore - game1[1].slateScore)
                  .map(([gameId, game]) => (
                    <RefinedGameCard key={gameId} game={game} showGameTime={true} />
                  ))}
              </>
            ) : (
              <div className="text-center p-4 bg-gray-100 text-gray-600 rounded-lg">
                No games found for today
              </div>
            )}
          </div>
          
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-600">How to use this design:</h3>
            <p className="text-gray-700 mt-2">
              To implement this design in your application, you can use the GameCardWrapper 
              component which allows easy switching between this design and the original one.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DemoPage;