import { ScheduleResponse } from './types';
import { DocumentData } from 'firebase/firestore';
import React from 'react';

interface GamePulseChartProps {
    games: ScheduleResponse;
}

const gameDurations: Record<string, number> = {
    "nba": 2.5,
    "mlb": 3,
    "nhl": 2.5,
    "ncaambb": 2,
}

// Add a hook to detect if the screen is md or smaller
function useIsMdOrSmaller() {
    const [isMdOrSmaller, setIsMdOrSmaller] = React.useState(false);
    React.useEffect(() => {
        function handleResize() {
            setIsMdOrSmaller(window.matchMedia('(max-width: 768px)').matches);
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMdOrSmaller;
}

export default function GamePulseChart({ games }: GamePulseChartProps) {
    // Initialize hourly buckets (0-23)
    const hourlyScores: number[] = Array(24).fill(0);
    let maxScore = 0;
    
    // Count games with TBD times
    let tbdGamesCount = 0;

    Object.values(games).forEach((game: DocumentData) => {
        if (game.date === "TBD") {
            tbdGamesCount++;
            return; // Skip TBD games
        }

        const gameDate = new Date(game.date);
        const startHour = gameDate.getHours(); // 0-23 based on local time
        const startMinutes = gameDate.getMinutes(); // 0-59 minutes
        
        // Get game duration based on sport
        const gameDuration = gameDurations[game.sport];
        
        // Calculate the score contribution per hour
        const score = game.slateScore || 0.5;
        
        // Calculate how much of the first hour the game uses (as a decimal between 0-1)
        const firstHourFraction = (60 - startMinutes) / 60;
        
        // Add score for the first partial hour
        hourlyScores[startHour] += score * firstHourFraction;
        maxScore = Math.max(maxScore, hourlyScores[startHour]);
        
        // Calculate total game end time in hours from start time
        const gameEndHourOffset = gameDuration - (1 - firstHourFraction);
        
        // Add score for all complete hours in the middle
        for (let i = 1; i < Math.floor(gameEndHourOffset); i++) {
            const currentHour = startHour + i;
            if (currentHour >= 24) break; // Don't go beyond 24 hours
            
            hourlyScores[currentHour] += score; // Full hour contribution
            maxScore = Math.max(maxScore, hourlyScores[currentHour]);
        }
        
        // Add score for the final partial hour if there is one
        const lastHourIndex = startHour + Math.floor(gameEndHourOffset);
        if (lastHourIndex < 24) {
            const lastHourFraction = gameEndHourOffset % 1;
            if (lastHourFraction > 0) {
                hourlyScores[lastHourIndex] += score * lastHourFraction;
                maxScore = Math.max(maxScore, hourlyScores[lastHourIndex]);
            }
        }
    });

    const MAX_SCORE = 6; // Maximum height of the bars
    const isMdOrSmaller = useIsMdOrSmaller();

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <div className="max-w-screen-lg w-full py-2 rounded-lg mb-3">
                <h3 className="text-base md:text-lg font-semibold text-center">Game Pulse</h3>
                {tbdGamesCount > 0 && (
                    <p className="text-xs text-center">
                        {tbdGamesCount} game{tbdGamesCount !== 1 ? 's have' : ' has'} yet to be scheduled
                    </p>
                )}
                <div className="w-full flex gap-[2%] justify-between h-20 px-[15%]">
                    {hourlyScores.map((score, index) => {
                        // Ensure bar has at least a minimum height if there's any score
                        const barHeight = Math.min(Math.max(0.7, score), MAX_SCORE);

                        return (
                            <div className="min-w-0 flex flex-col items-center flex-1 basis-0" key={index}>
                                <div key={index} className="w-full flex flex-col justify-center items-center h-full mb-0.5">
                                    <div
                                        className={`w-full bg-slate-medium rounded-full transition-all duration-300 ease-in-out`}
                                        style={{ height: `${100 * barHeight / MAX_SCORE}%` }}
                                    />
                                </div>
                                <span className="h-0 flex flex-col items-center text-xs text-gray-500">
                                    {/* Only print every other hour label on md and smaller, otherwise print all */}
                                    {(!isMdOrSmaller || index % 2 === 0) ? (
                                        <>
                                            <p>{`${(index % 12 == 0) ? 12 : index % 12}`}</p>
                                            <p>{index % 12 === 0 ? `${index >= 12 ? 'PM' : 'AM'}` : ''}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="invisible select-none">&nbsp;</p>
                                            <p className="invisible select-none">&nbsp;</p>
                                        </>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
