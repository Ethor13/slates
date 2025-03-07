import React from "react";
import GameCard from "./GameCard";
import { DocumentData } from "firebase/firestore";
import { formatGameTime } from "../../helpers";
import { GamesListProps, ScheduleResponse, Sort } from "./types";

const split_by_time = (games: ScheduleResponse) => {
  let games_by_time: Record<string, DocumentData[]> = {};
  
  Object.values(games).forEach((game) => {
    if (!(game.date in games_by_time)) {
      games_by_time[game.date] = [];
    }
    games_by_time[game.date].push(game);
  });
  
  return games_by_time;
};

const renderGames = (games: ScheduleResponse, sortBy: Sort) => {
  if (sortBy === Sort.TIME) {
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
  } else if (sortBy === Sort.SCORE) {
    return (
      <div className="flex flex-col gap-4">
        {Object.values(games)
          .sort((game1, game2) => game2.slateScore - game1.slateScore)
          .map((game) => (
            <GameCard key={game.id} game={game} showGameTime={true} />
          ))}
      </div>
    );
  } else {
    throw new Error("Invalid sortBy value");
  }
};

const GamesList: React.FC<GamesListProps> = ({ sortBy, games }) => {
  if (!Object.keys(games).length) return (
    <div className="text-center p-4 mt-8 text-lg bg-gray-100 text-gray-600 rounded-lg">
      No games scheduled
    </div>
  );

  return (
    <div className="flex flex-col justify-center gap-4 items-center">
      {renderGames(games, sortBy)}
    </div>
  );
};

export default GamesList;