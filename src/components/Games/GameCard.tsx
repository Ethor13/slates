import React from "react";
import { getInterestLevel } from "../../helpers";
import { GameCardProps } from "./types";
import Broadcasts from "./Broadcasts";
import TeamInfo from "./TeamInfo";
import { formatGameTime } from "../../helpers";
import { Star } from "lucide-react";

// Interest level styling (now only using the background colors)
const interestLevelClasses: Record<string, string[]> = {
    "favorite": ["", "border-2 border-yellow-500 bg-yellow-100 text-yellow-500"],
    "must-watch": ["", "border-2 border-green-500 bg-green-100 text-green-500"],
    "high-interest": ["", "border-2 border-blue-500 bg-blue-100 text-blue-500"],
    "decent": ["", "border-2 border-orange-500 bg-orange-100 text-orange-500"],
    "low-interest": ["", "border-2 border-red-500 bg-red-100 text-red-500"],
    "unknown-interest": ["", "border-2 border-gray-500 bg-gray-300 text-gray-500"]
};

const GameCard: React.FC<GameCardProps> = ({ game }) => {
    const interestLevel = getInterestLevel(game.slateScore);

    return (
        <div className="w-full py-1 print:py-[1px] break-inside-avoid">
            {/* Main card - always visible */}
            <div className="flex items-center w-full relative">
                {/* Slate Score - fixed width */}
                <div className={`h-10 w-10 print:w-6 print:h-6 text-base print:text-sm mr-2 print:mr-1 aspect-square flex items-center justify-center rounded-full font-semibold ${interestLevelClasses[interestLevel.className][1]} print:border-[1px]`}>
                    {interestLevel.rating}
                </div>

                {/* Favorite Star - only visible if the game is a favorite */}
                {game.isFavorite && (
                    <div className="z-10 absolute top-0 left-[1.5rem] -translate-y-[0.4rem] print:left-[0.9rem] print:-translate-y-[0.15rem]">
                        <Star className="text-yellow-500 fill-yellow-200 w-6 h-6 print:w-4 print:h-4" />
                    </div>
                )}

                {/* Teams and Game Status - controlled width proportions */}
                <div className="w-full grid grid-rows-2 grid-cols-[1fr_2fr] md:grid-rows-1 md:grid-cols-[1fr_3fr_1rem_3fr] xl:grid-cols-[2fr_4fr_1rem_4fr_10fr] print:grid-rows-1 print:grid-cols-[4rem_3fr_1rem_3fr_6fr] items-center">
                    {/* Game Status - fixed proportion */}
                    <div className="h-full row-start-1 row-end-3 md:row-start-1 md:row-end-2 print:row-start-1 print:row-end-2 flex justify-end sm:justify-center">
                        <div className="h-full flex justify-center flex-col text-center text-sm leading-none">
                            <div className="text-lg sm:text-sm print:text-xs sm:leading-none uppercase">{game.sport}</div>
                            <div className="text-lg sm:text-sm print:text-xs sm:leading-none overflow-visible whitespace-nowrap">{formatGameTime(game.date)}</div>
                        </div>
                    </div>
                    {/* Away Team - fixed proportion */}
                    <div className="h-full row-start-1 pb-[2px] sm:pb-0">
                        <TeamInfo team={game.away} isAway={true} />
                    </div>
                    {/* "at" separator */}
                    <div className="hidden sm:flex h-full row-start-1 items-center justify-center text-sm">at</div>
                    {/* Home Team - fixed proportion */}
                    <div className="h-full row-start-2 md:row-start-1 print:row-start-1">
                        <TeamInfo team={game.home} isAway={false} />
                    </div>
                    {/* Broadcasts component - fixed proportion */}
                    <div className="h-full hidden xl:block print:block">
                        <Broadcasts broadcasts={game.broadcasts} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameCard;