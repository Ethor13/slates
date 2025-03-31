import React from "react";
import { getInterestLevel } from "../../../helpers";
import { GameCardProps } from "../types";
import { useAuth } from '../../../contexts/AuthContext';
import Broadcasts from "./Broadcasts";
import TeamInfo from "./TeamInfo";
import { formatGameTime } from "../../../helpers";

// Interest level styling (now only using the background colors)
const interestLevelClasses: Record<string, string[]> = {
    "favorite": ["", "border-2 border-yellow-500 bg-yellow-100 text-yellow-500"],
    "must-watch": ["", "border-2 border-green-500 bg-green-100 text-green-500"],
    "high-interest": ["", "border-2 border-blue-500 bg-blue-100 text-blue-500"],
    "decent": ["", "border-2 border-orange-500 bg-orange-100 text-orange-500"],
    "low-interest": ["", "border-2 border-red-500 bg-red-100 text-red-500"],
    "unknown-interest": ["", "border-2 border-gray-500 bg-gray-300 text-gray-500"]
};

const RefinedGameCard: React.FC<GameCardProps> = ({ game }) => {
    const { tvChannels } = useAuth();
    const interestLevel = getInterestLevel(game.slateScore, game.isFavorite);

    return (
        <div className="w-full py-2">

            {/* Game Notes */}
            {/* {game.notes && game.notes[0]?.headline && (
                <div className="">
                    <div className="text-xs text-gray-600">
                        {game.notes[0].headline}
                    </div>
                </div>
            )} */}

            {/* Main card - always visible */}
            <div className="flex items-center w-full">
                {/* Slate Score - fixed width */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4 ${interestLevelClasses[interestLevel.className][1]}`}>
                    {interestLevel.rating}
                </div>

                {/* Teams and Game Status - controlled width proportions */}
                <div className="grid grid-cols-10 w-full items-center">
                    {/* Away Team - fixed proportion */}
                    <div className="col-span-2">
                        <TeamInfo team={game.away} opponent={game.home} isAway={true} />
                    </div>

                    {/* Game Status - fixed proportion */}
                    <div className="col-span-1 flex justify-center">
                        <div className="w-full text-center px-2">
                            <div className="text-lg font-medium">@</div>
                                <div className="text-xs truncate">{formatGameTime(game.date)}</div>
                        </div>
                    </div>

                    {/* Home Team - fixed proportion */}
                    <div className="col-span-2">
                        <TeamInfo team={game.home} opponent={game.away} isAway={false} />
                    </div>

                    {/* Broadcasts component - fixed proportion */}
                    <div className="col-span-5 h-full hidden xl:block">
                        <Broadcasts broadcasts={game.broadcasts} tvChannels={tvChannels} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefinedGameCard;