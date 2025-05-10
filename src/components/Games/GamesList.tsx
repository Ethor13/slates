import React, { useState, useEffect, useRef } from 'react';
import { GamesListProps, ScheduleResponse, Sort } from './types';
import GameCard from './GameCard';
import { formatGameTime } from '../../helpers';
import { ChevronDown } from 'lucide-react';
import { BroadcastsHeader } from './Broadcasts';

// Helper function to split games by hour
const split_by_time = (games: ScheduleResponse) => {
    const games_by_time: Record<string, Record<string, any>> = {};

    Object.entries(games).forEach(([gameId, game]) => {
        if (game.date === "TBD") {
            if (!("TBD" in games_by_time)) {
                games_by_time["TBD"] = {};
            }
            games_by_time["TBD"][gameId] = game; // Store TBD games separately
            return;
        }

        // Extract the date and create a copy for hour grouping
        const gameDate = new Date(game.date);
        // Create an hour key with minutes, seconds, and milliseconds set to 0
        const hourDate = new Date(gameDate);
        hourDate.setMinutes(0, 0, 0);
        const hourKey = hourDate.toISOString();

        if (!(hourKey in games_by_time)) {
            games_by_time[hourKey] = {};
        }
        games_by_time[hourKey][gameId] = game;
    });

    return games_by_time;
};

const renderGames = (
    games: ScheduleResponse,
    sortBy: Sort
) => {
    if (sortBy === Sort.TIME) {
        // Group games by start time hour and then sort by exact time within each hour
        const gamesByTime = split_by_time(games);

        return (
            <div className="flex flex-col w-full divide-y divide-gray-200">
                {Object.entries(gamesByTime)
                    .sort(([timeA, _], [timeB, __]) => {
                        if (timeA === "TBD") return 1; // Move TBD games to the end
                        if (timeB === "TBD") return -1;
                        return new Date(timeA).getTime() - new Date(timeB).getTime();
                    })
                    .map(([gameTime, timeGames]) => (
                        <div key={gameTime} className="flex flex-col w-full">
                            <h2 className="text-md font-medium">{formatGameTime(gameTime)}</h2>
                            <div className="flex flex-col w-full divide-y divide-gray-200">
                                {Object.entries(timeGames)
                                    // First sort by exact time
                                    .sort(([_, game1], [__, game2]) => {
                                        if (game1.date === "TBD") return 1; // Move TBD games to the end
                                        if (game2.date === "TBD") return -1;
                                        return new Date(game1.date).getTime() - new Date(game2.date).getTime()
                                    })
                                    // Then break ties with slate score
                                    .sort(([_, game1], [__, game2]) => {
                                        if (game1.date === "TBD" && game2.date === "TBD") return game2.slateScore - game1.slateScore;
                                        if (game1.date === "TBD" || game2.date === "TBD") return 0; // Keep TBD games in their place
                                        const time1 = new Date(game1.date).getTime();
                                        const time2 = new Date(game2.date).getTime();
                                        // If times are the same (within the same minute), sort by slate score
                                        if (Math.abs(time1 - time2) < 60000) {
                                            return game2.slateScore - game1.slateScore;
                                        }
                                        // Otherwise keep the time sorting
                                        return time1 - time2;
                                    })
                                    .map(([gameId, game]) => (
                                        <GameCard key={gameId} game={game} />
                                    ))}
                            </div>
                        </div>
                    ))
                }
            </div>
        );
    } else if (sortBy === Sort.SCORE) {
        // Sort all games by slate score
        const sortedGames = Object.entries(games).sort((game1, game2) => {
            if (game1[1].isFavorite && !game2[1].isFavorite) {
                return -1;
            }
            if (!game1[1].isFavorite && game2[1].isFavorite) {
                return 1;
            }
            return game2[1].slateScore - game1[1].slateScore;
        });

        return (
            <div className="flex flex-col w-full divide-y divide-gray-200">
                {sortedGames.map(([gameId, game]) => (
                    <GameCard key={gameId} game={game} />
                ))}
            </div>
        );
    } else {
        throw new Error("Invalid sortBy value");
    }
};

const GamesList: React.FC<GamesListProps> = ({
    sortBy,
    setSortBy,
    games,
    selectedDate
}) => {
    const [renderedGames, setRenderedGames] = useState<React.ReactNode | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (Object.keys(games).length) {
            setRenderedGames(renderGames(games, sortBy));
        } else {
            setRenderedGames(
                <div className="w-full text-center text-lg text-gray-600 py-8">
                    No games scheduled for the selected sports
                </div>
            );
        }
    }, [games, sortBy]);

    return (
        <div className="flex flex-col w-full pt-8">
            {/* Header section with date and sort */}
            <div className="flex justify-between items-center w-full mb-6">
                {/* Selected date display */}
                <div>
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
            
            {/* Broadcasts header - shows TV providers as column headers */}
            <div className="hidden xl:block">
                <BroadcastsHeader/>
            </div>
            
            {/* Games list */}
            <div className="w-full">
                {renderedGames}
            </div>
        </div>
    );
};

export default GamesList;