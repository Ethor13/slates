import React, { useState, useEffect } from 'react';
import { GamesListProps, ScheduleResponse, Sort } from '../types';
import RefinedGameCard from './MinimalGameCard';

const renderGames = (
    games: ScheduleResponse,
    sortBy: Sort,
    showGameTime: boolean
) => {
    const sortedGames = Object.entries(games)
        .sort((game1, game2) => game2[1].slateScore - game1[1].slateScore);

    return (
        <div className="flex flex-col w-full">
            {sortedGames.map(([gameId, game]) => (
                <RefinedGameCard key={gameId} game={game} showGameTime={showGameTime} />
            ))}
        </div>
    );
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
            setRenderedGames(renderGames(games, sortBy, true));
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
            <div className="flex justify-between items-center w-full px-4 mb-4">
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