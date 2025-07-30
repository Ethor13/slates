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
        <div className="w-full py-[6px] print:py-[1px] break-inside-avoid">
            {/* Main card - always visible */}
            <div className="flex items-center w-full relative">
                {/* Slate Score - fixed width */}
                <div className={`h-10 w-10 print:w-6 print:h-6 text-base print:text-sm mr-2 print:mr-1 aspect-square flex items-center justify-center rounded-full font-semibold ${interestLevelClasses[interestLevel.className][1]} print:border-[1px]`}>
                    {interestLevel.rating}
                </div>

                {/* Favorite Star - only visible if the game is a favorite */}
                {game.isFavorite && (
                    <div className="z-10 absolute top-[-0.2rem] left-[1.5rem] md:top-[-0.3rem] print:left-[0.9rem] print:-top-[0.15rem]">
                        <Star className="text-yellow-500 fill-yellow-200 w-6 h-6 print:w-4 print:h-4" />
                    </div>
                )}

                {/* Teams and Game Status - controlled width proportions */}
                <div className="w-full ml-2 grid grid-cols-[2fr_1fr_2fr] xl:grid-cols-[4fr_4rem_4fr_10fr] print:grid-cols-[3fr_2rem_3fr_6fr] items-center">
                    {/* Away Team - fixed proportion */}
                    <div className="h-full pb-[2px] min-w-0">
                        <TeamInfo team={game.away} isAway={true} />
                    </div>
                    {/* Game Status - fixed proportion */}
                    <div className="h-full flex justify-center">
                        <div className="h-full flex justify-center flex-col text-center text-sm leading-none">
                            <div className="text-sm md:text-base print:leading-none print:text-xs print:font-light uppercase">{game.sport}</div>
                            <div className="text-xs md:text-md print:leading-none print:text-xs print:font-light overflow-visible whitespace-nowrap">{formatGameTime(game.date)}</div>
                        </div>
                    </div>
                    {/* Home Team - fixed proportion */}
                    <div className="h-full min-w-0">
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