import React, { useState, useEffect } from 'react';
import { GamesListProps, ScheduleResponse, Sort } from '../types';
import RefinedGameCard from './MinimalGameCard';
import { formatGameTime } from '../../../helpers';

// Helper function to split games by hour
const split_by_time = (games: ScheduleResponse) => {
    const games_by_time: Record<string, Record<string, any>> = {};

    Object.entries(games).forEach(([gameId, game]) => {
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
                    .sort(([timeA, _], [timeB, __]) => new Date(timeA).getTime() - new Date(timeB).getTime())
                    .map(([gameTime, timeGames]) => (
                        <div key={gameTime} className="flex flex-col w-full">
                            <h2 className="text-md font-medium">{formatGameTime(gameTime)}</h2>
                            <div className="pl-8 flex flex-col w-full divide-y divide-gray-200">
                                {Object.entries(timeGames)
                                    // First sort by exact time
                                    .sort(([_, game1], [__, game2]) => new Date(game1.date).getTime() - new Date(game2.date).getTime())
                                    // Then break ties with slate score
                                    .sort(([_, game1], [__, game2]) => {
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
                                        <RefinedGameCard key={gameId} game={game} />
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
                    <RefinedGameCard key={gameId} game={game} />
                ))}
            </div>
        );
    } else {
        throw new Error("Invalid sortBy value");
    }
};

const MinimalGamesList: React.FC<GamesListProps> = ({
    sortBy,
    setSortBy,
    games,
    selectedDate
}) => {
    const [renderedGames, setRenderedGames] = useState<React.ReactNode | null>(null);

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
        <div className="flex flex-col w-full pt-8 mx-10">
            <div className="flex justify-between items-center w-full">
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
                    <div className="flex items-center">
                        <p className="font-sans text-md">Sort By:&nbsp;</p>
                        <button
                            className="bg-transparent border-none font-bold cursor-pointer text-md"
                            onClick={() => {
                                setSortBy(sortBy === Sort.SCORE ? Sort.TIME : Sort.SCORE);
                            }}
                        >
                            {sortBy}
                        </button>
                    </div>
                </div>
            </div>

            {/* Games */}
            <div className="w-full">
                {renderedGames}
            </div>
        </div>
    );
};

export default MinimalGamesList;