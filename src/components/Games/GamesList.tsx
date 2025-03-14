import React, { useState, useEffect } from "react";
import GameCard from "./GameCard";
import { DocumentData } from "firebase/firestore";
import { formatGameTime } from "../../helpers";
import { GamesListProps, ScheduleResponse, Sort } from "./types";

const split_by_time = (games: ScheduleResponse) => {
  const games_by_time: Record<string, Record<string, DocumentData>> = {};

  Object.entries(games).forEach(([gameId, game]) => {
    if (!(game.date in games_by_time)) {
      games_by_time[game.date] = {};
    }
    games_by_time[game.date][gameId] = game;
  });

  return games_by_time;
};

const renderGames = (games: ScheduleResponse, sortBy: Sort) => {
  if (sortBy === Sort.TIME) {
    return (
      Object.entries(split_by_time(games))
        .sort(([timeA, _], [timeB, __]) => new Date(timeA).getTime() - new Date(timeB).getTime())
        .map(([gameTime, games]) => (
          <div key={gameTime} className="flex flex-col gap-4">
            <h2 className="m-0 text-2xl">{formatGameTime(gameTime)}</h2>
            {Object.entries(games)
              .sort(([_, game1], [__, game2]) => game2.slateScore - game1.slateScore)
              .map(([gameId, game]) => (
                <GameCard key={gameId} game={game} showGameTime={false} />
              ))}
          </div>
        ))
    );
  } else if (sortBy === Sort.SCORE) {
    return (
      <div className="flex flex-col gap-4">
        {Object.entries(games)
          .sort((game1, game2) => game2[1].slateScore - game1[1].slateScore)
          .map(([gameId, game]) => (
            <GameCard key={gameId} game={game} showGameTime={true} />
          ))}
      </div>
    );
  } else {
    throw new Error("Invalid sortBy value");
  }
};

const GamesList: React.FC<GamesListProps> = ({ sortBy, games }) => {
  const [renderedGames, setRenderedGames] = useState<React.ReactNode | null>(null);
  const [hasBeenRendered, setHasBeenRendered] = useState(false);

  useEffect(() => {
    if (Object.keys(games).length && !hasBeenRendered) {
      setHasBeenRendered(true);
    }
  }, [games]);

  useEffect(() => {
    if (Object.keys(games).length) {
      setRenderedGames(renderGames(games, sortBy));
    } else if (!hasBeenRendered) {
      setRenderedGames(
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    else {
      setRenderedGames(
        <div className="text-center p-4 mt-8 text-lg bg-gray-100 text-gray-600 rounded-lg">
          No games scheduled
        </div>
      );
    }
  }, [games, sortBy]);

  return (
    <div className={`flex flex-col justify-center gap-4 items-center`}>
      {renderedGames}
    </div>
  );
};

export default GamesList;