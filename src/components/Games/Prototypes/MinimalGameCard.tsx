import React from "react";
import { getInterestLevel } from "../../../helpers";
import { GameCardProps } from "../types";
import { useAuth } from '../../../contexts/AuthContext';
import Broadcasts from "./Broadcasts";
import TeamInfo from "./TeamInfo";
import { formatGameTime } from "../../../helpers";

// Interest level styling (now only using the background colors)
const interestLevelClasses: Record<string, string[]> = {
    "favorite": ["", "bg-yellow-100 text-yellow-800"],
    "must-watch": ["", "bg-green-100 text-green-800"],
    "high-interest": ["", "bg-blue-100 text-blue-800"],
    "decent": ["", "bg-orange-100 text-orange-800"],
    "low-interest": ["", "bg-red-100 text-red-800"],
    "unknown-interest": ["", "bg-gray-300 text-gray-500"]
};

const RefinedGameCard: React.FC<GameCardProps> = ({ game, showGameTime }) => {
    const { userPreferences, tvChannels } = useAuth();
    const favoriteTeams = userPreferences.favoriteTeams || [];
    const isFavoriteGame = favoriteTeams.some(favoriteTeam =>
        game.sport === favoriteTeam.sport && [game.home.id, game.away.id].includes(favoriteTeam.id)
    );
    const interestLevel = getInterestLevel(game.slateScore, isFavoriteGame);

    return (
        <div className={`${isFavoriteGame ? "order-[-1]" : ""} w-full max-w-screen-xl mx-auto py-2 border-b border-gray-200 last:border-b-0`}>

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
                <div className="grid grid-cols-10 w-full gap-2 items-center">
                    {/* Away Team - fixed proportion */}
                    <div className="col-span-2">
                        <TeamInfo team={game.away} opponent={game.home} isAway={true} />
                    </div>

                    {/* Game Status - fixed proportion */}
                    <div className="col-span-1 flex justify-center">
                        <div className="w-full text-center px-2">
                            <div className="text-lg font-medium">@</div>
                            {showGameTime && <div className="text-xs truncate">{formatGameTime(game.date)}</div>}
                        </div>
                    </div>

                    {/* Home Team - fixed proportion */}
                    <div className="col-span-2">
                        <TeamInfo team={game.home} opponent={game.away} isAway={false} />
                    </div>

                    {/* Broadcasts component - fixed proportion */}
                    <div className="col-span-5 hidden xl:block">
                        <Broadcasts broadcasts={game.broadcasts} tvChannels={tvChannels} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefinedGameCard;