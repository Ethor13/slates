import React, { useState, useEffect } from "react";
import GameCard from "./GameCard";
import { formatGameTime } from "../../helpers";

interface Game {
  id: string;
  date: string;
  slateScore: number;
  sport: string;
  away: any;
  home: any;
  broadcasts: Record<string, any>;
}

interface GamesListProps {
  sports: string[];
  date: string;
  sortBy: "time" | "score";
}

const GamesList: React.FC<GamesListProps> = ({ sports, date, sortBy }) => {
  const [games, setGames] = useState<Record<string, Game>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    if (!sports) {
      setGames({});
      return;
    }

    try {
      // make the cursor spinny to indicate loading
      document.body.classList.add("loading");

      const formattedDate = date
        ? new Date(date).toLocaleDateString("en-CA").replace(/-/g, "")
        : "";

      // Updated endpoint to use query parameters: sports and date
      let endpoint = `/api/slate-scores?date=${formattedDate}`;
      endpoint += sports.length > 0 ? `&sports=${sports.join(",")}` : "";

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to fetch games");
      
      const games = await response.json();
      setGames(games || {});
      setError(null);
      
      // Reset loading class
      document.body.classList.remove("loading");
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [sports, date]); // re-fetch when sport or date changes

  const split_by_time = (games: Record<string, Game>) => {
    let games_by_time: Record<string, Game[]> = {};
    
    Object.values(games).forEach((game) => {
      if (!(game.date in games_by_time)) {
        games_by_time[game.date] = [];
      }
      games_by_time[game.date].push(game);
    });
    
    return games_by_time;
  };

  const renderGames = () => {
    if (sortBy === "time") {
      return (
        Object.entries(split_by_time(games))
          .sort(([timeA], [timeB]) => new Date(timeA).getTime() - new Date(timeB).getTime())
          .map(([gameTime, games]) => (
            <div key={gameTime} className="flex flex-col gap-4">
              <h2 className="m-0 text-2xl">{formatGameTime(gameTime)}</h2>
              {games
                .sort((game1, game2) => game2.slateScore - game1.slateScore)
                .map((game) => (
                  <GameCard key={game.id} game={game} showGameTime={false} />
                ))}
            </div>
          ))
      );
    } else {
      // Sort by slate score
      return (
        <div className="flex flex-col gap-4">
          {Object.values(games)
            .sort((game1, game2) => game2.slateScore - game1.slateScore)
            .map((game) => (
              <GameCard key={game.id} game={game} showGameTime={true} />
            ))}
        </div>
      );
    }
  };

  if (error) return (
    <div className="text-center p-4 mt-8 text-lg bg-red-100 text-red-600 rounded-lg">
      Error: {error}
    </div>
  );
  
  if (!Object.keys(games).length) return (
    <div className="text-center p-4 mt-8 text-lg bg-gray-100 text-gray-600 rounded-lg">
      No games scheduled
    </div>
  );

  return (
    <div className="flex flex-col justify-center gap-4 items-center">
      {renderGames()}
    </div>
  );
};

export default GamesList;