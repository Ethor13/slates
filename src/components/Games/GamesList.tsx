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
    primarySort: Sort,
    secondarySort: Sort
) => {
    // Helper to get sort value
    const getSortValue = (game: any, sort: Sort) => {
        switch (sort) {
            case Sort.TIME:
                return game.date === 'TBD' ? Infinity : new Date(game.date).getTime();
            case Sort.SCORE:
                return game.slateScore;
            case Sort.SPORT:
                return game.sport || '';
            default:
                return '';
        }
    };

    // General sort function
    const sortFn = ([, a]: any, [, b]: any) => {
        let primaryA = getSortValue(a, primarySort);
        let primaryB = getSortValue(b, primarySort);
        if (primaryA < primaryB) return primarySort === Sort.SCORE ? 1 : -1;
        if (primaryA > primaryB) return primarySort === Sort.SCORE ? -1 : 1;

        let secondaryA = getSortValue(a, secondarySort);
        let secondaryB = getSortValue(b, secondarySort);
        if (secondaryA < secondaryB) return secondarySort === Sort.SCORE ? 1 : -1;
        if (secondaryA > secondaryB) return secondarySort === Sort.SCORE ? -1 : 1;
        return 0;
    };

    // Section heading function (except for favorites)
    const getSectionHeading = (game: any) => {
        if (primarySort === Sort.SPORT) {
            return String(game.sport).toUpperCase() || 'Other';
        } else if (primarySort === Sort.TIME) {
            if (game.date === 'TBD' || game.date === undefined) return 'TBD';
            const d = new Date(game.date);
            d.setMinutes(0, 0, 0);
            return formatGameTime(d.toISOString());
        } else if (primarySort === Sort.SCORE) {
            if (game.slateScore === undefined) return "Score Unavailable";
            if (game.slateScore >= 0.8) return "80+";
            if (game.slateScore >= 0.6) return "60-79"; 
            if (game.slateScore >= 0.4) return "40-59";
            if (game.slateScore >= 0) return "0-39";
            return "Score Unavailable";
        }
        return null;
    }

    // Always collect favorites first
    const favorites: [string, any][] = Object.entries(games).filter(([, game]) => game.isFavorite);
    // All non-favorite games
    const nonFavorites: [string, any][] = Object.entries(games);

    // If no sectioning, render flat list (but still show favorites first)
    if (!getSectionHeading || getSectionHeading({}) === null) {
        const sortedFavorites = favorites.sort(sortFn);
        const sortedNonFavorites = nonFavorites.sort(sortFn);
        return (
            <div className="flex flex-col w-full divide-y divide-gray-200">
                {sortedFavorites.length > 0 && (
                    <div className="flex flex-col w-full">
                        <h2 className="text-md font-medium">Favorites</h2>
                        <div className="flex flex-col w-full divide-y divide-gray-200">
                            {sortedFavorites.map(([gameId, game]) => (
                                <GameCard key={gameId} game={game} />
                            ))}
                        </div>
                    </div>
                )}
                {sortedNonFavorites.map(([gameId, game]) => (
                    <GameCard key={gameId} game={game} />
                ))}
            </div>
        );
    }

    // Group non-favorite games by section heading
    const sectioned: Record<string, [string, any][]> = {};
    nonFavorites.forEach(([gameId, game]) => {
        const heading = getSectionHeading(game);
        if (!heading) return;
        if (!sectioned[heading]) sectioned[heading] = [];
        sectioned[heading].push([gameId, game]);
    });

    // Sort section headings
    const sortedHeadings = Object.keys(sectioned).sort((a, b) => {
        // For time, sort by date; for sport, alphabetical
        if (primarySort === Sort.TIME) {
            if (a === 'TBD') return 1;
            if (b === 'TBD') return -1;
            // a and b are of the format HH:00 (A|P)M
            const aHour = Number(a.split(":")[0]) + (a.includes("PM") && a.split(":")[0] !== "12" ? 12 : 0);
            const bHour = Number(b.split(":")[0]) + (b.includes("PM") && b.split(":")[0] !== "12" ? 12 : 0);
            return aHour - bHour;
        } else if (primarySort === Sort.SCORE) {
            if (a === "Score Unavailable") return 1;
            if (b === "Score Unavailable") return -1;
            return b.localeCompare(a, undefined, { numeric: true });
        }
        return a.localeCompare(b);
    });

    return (
        <div className="flex flex-col w-full">
            {/* Favorites always at the top */}
            {favorites.length > 0 && (
                <div className="flex flex-col w-full">
                    <h2 className="text-md font-medium">Favorites</h2>
                    <div className="flex flex-col w-full divide-y divide-gray-200">
                        {favorites.sort(sortFn).map(([gameId, game]) => (
                            <GameCard key={gameId} game={game} />
                        ))}
                    </div>
                </div>
            )}
            {sortedHeadings.map((heading) => (
                <div key={heading} className="flex flex-col w-full">
                    <h2 className="text-md font-medium">{heading}</h2>
                    <div className="flex flex-col w-full divide-y divide-gray-200">
                        {sectioned[heading].sort(sortFn).map(([gameId, game]) => (
                            <GameCard key={gameId} game={game} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const GamesList: React.FC<GamesListProps> = ({
    sortBy,
    setSortBy,
    secondarySort,
    setSecondarySort,
    games,
    selectedDate
}) => {
    const [renderedGames, setRenderedGames] = useState<React.ReactNode | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSecondaryDropdownOpen, setIsSecondaryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const secondaryDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (Object.keys(games).length) {
            setRenderedGames(renderGames(games, sortBy, secondarySort));
        } else {
            setRenderedGames(
                <div className="w-full text-center text-lg text-gray-600 py-8">
                    No games scheduled for the selected sports
                </div>
            );
        }
    }, [games, sortBy, secondarySort]);

    // Responsive dropdown close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (secondaryDropdownRef.current && !secondaryDropdownRef.current.contains(event.target as Node)) {
                setIsSecondaryDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col w-full pt-8">
            {/* Header section with date and sort */}
            <div className="flex flex-col sm:flex-row justify-between items-end w-full mb-2 gap-2">
                {/* Selected date display */}
                <div>
                    <p className="font-bold">
                        {selectedDate.toLocaleDateString("en-CA", {
                            month: 'long',
                            weekday: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                {/* Sort selectors */}
                <div className="flex flex-col min-w-[180px] items-end self-end">
                    <div className="w-full flex items-center relative justify-end print:hidden">
                        <p className="font-sans text-md text-right">Sort by:&nbsp;</p>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="bg-transparent border-none font-bold cursor-pointer flex items-center text-md gap-0.5"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-haspopup="listbox"
                                aria-expanded={isDropdownOpen}
                            >
                                {sortBy}
                                <ChevronDown
                                    className={`text-gray-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    size={16}
                                />
                            </button>
                            {isDropdownOpen && (
                                <ul className="absolute right-0 bg-white border border-gray-300 list-none shadow-md z-50 flex flex-col w-36" role="listbox">
                                    {Object.entries(Sort).map(([key, value]) => (
                                        <li
                                            key={key}
                                            className={`cursor-pointer hover:bg-slate-light/20 px-1 text-black text-md pl-2 pr-5 text-right ${sortBy === value ? 'font-bold' : ''}`}
                                            onClick={() => {
                                                setSortBy(value);
                                                setIsDropdownOpen(false);
                                            }}
                                            role="option"
                                            aria-selected={sortBy === value}
                                        >
                                            {value}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="w-full flex items-center relative justify-end print:hidden">
                        <p className="font-sans text-md text-right">Then by:&nbsp;</p>
                        <div className="relative" ref={secondaryDropdownRef}>
                            <button
                                className="bg-transparent border-none font-bold cursor-pointer flex items-center text-md gap-0.5"
                                onClick={() => setIsSecondaryDropdownOpen(!isSecondaryDropdownOpen)}
                                aria-haspopup="listbox"
                                aria-expanded={isSecondaryDropdownOpen}
                            >
                                {secondarySort}
                                <ChevronDown
                                    className={`text-gray-700 transition-transform ${isSecondaryDropdownOpen ? 'rotate-180' : ''}`}
                                    size={16}
                                />
                            </button>
                            {isSecondaryDropdownOpen && (
                                <ul className="absolute right-0 bg-white border border-gray-300 list-none shadow-md z-50 flex flex-col w-36" role="listbox">
                                    {Object.entries(Sort).map(([key, value]) => (
                                        <li
                                            key={key}
                                            className={`cursor-pointer hover:bg-slate-light/20 px-1 text-black text-md pl-2 pr-5 text-right ${secondarySort === value ? 'font-bold' : ''} ${sortBy === value ? 'opacity-50 pointer-events-none' : ''}`}
                                            onClick={() => {
                                                if (sortBy !== value) setSecondarySort(value);
                                                setIsSecondaryDropdownOpen(false);
                                            }}
                                            role="option"
                                            aria-selected={secondarySort === value}
                                            aria-disabled={sortBy === value}
                                        >
                                            {value}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className='hidden print:block text-sm'>
                        Sorted by <b>{sortBy}</b> then by <b>{secondarySort}</b>
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