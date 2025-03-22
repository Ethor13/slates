import React, { useState, useEffect, useRef } from "react";
import GameCard from "./GameCard";
import { DocumentData } from "firebase/firestore";
import { formatGameTime } from "../../helpers";
import { GamesListProps, ScheduleResponse, Sort } from "./types";
import { ChevronDown } from "lucide-react";

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
            <h2 className="text-2xl font-semibold">{formatGameTime(gameTime)}</h2>
            <div className="flex flex-col gap-4">
              {Object.entries(games)
                .sort(([_, game1], [__, game2]) => game2.slateScore - game1.slateScore)
                .map(([gameId, game]) => (
                  <GameCard key={gameId} game={game} showGameTime={false} />
                ))}
            </div>
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

const GamesList: React.FC<GamesListProps> = ({ sortBy, games, setSortBy, selectedDate }) => {
  const [renderedGames, setRenderedGames] = useState<React.ReactNode | null>(null);
  const [hasBeenRendered, setHasBeenRendered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <div key="no-games" className="w-[50rem] text-center text-lg text-gray-600">
          No games scheduled for the selected sports
        </div>
      );
    }
  }, [games, sortBy]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col justify-center gap-4 items-center pt-8 mb-8`}>
      <div className="flex flex-row justify-between items-center w-full">
        {/* Selected date display */}
        <div className="text-center">
          <p className="text-md font-bold">
            {selectedDate.toLocaleDateString("en-CA", {
              month: 'long',
              weekday: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Sort selector */}
        <div>
          <div className="w-full flex justify-between items-center relative">
            <p className="font-sans text-md">Sort By:&nbsp;</p>
            <div className="relative" ref={dropdownRef}>
              <button
                className="bg-transparent border-none font-bold cursor-pointer flex items-center text-md gap-0.5"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {sortBy}
                <ChevronDown
                  className={`text-gray-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  size={16}
                />
              </button>
              {isDropdownOpen && (
                <ul className="absolute right-0 bg-white border border-gray-300 list-none shadow-md z-50 flex flex-col w-28">
                  {Object.entries(Sort).map(([key, value]) => (
                    <li
                      key={key}
                      className="cursor-pointer hover:bg-slate-deep hover:text-white px-1 text-gray-700 text-md pl-2 pr-5 text-right"
                      onClick={() => {
                        setSortBy(value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Games */}
      <div className="flex flex-col gap-4 w-full">
        {renderedGames}
      </div>
    </div>
  );
};

export default GamesList;