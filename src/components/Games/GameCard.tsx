import React from "react";
import { getInterestLevel, formatGameTime } from "../../helpers";

// Define TypeScript interfaces
interface Team {
  shortName: string;
  record: string;
  logo: string;
  matchupQualities?: {
    teampredwinpct: number;
  };
}

interface Game {
  id: string;
  sport: string;
  date: string;
  slateScore: number;
  away: Team;
  home: Team;
  broadcasts: Record<string, any>;
}

interface GameCardProps {
  game: Game;
  showGameTime: boolean;
}

interface TeamInfoProps {
  homeAway: "home" | "away";
  team: Team;
}

interface BroadcastsProps {
  broadcasts: Record<string, any>;
}

const GameCard: React.FC<GameCardProps> = ({ game, showGameTime }) => {
  const interestLevel = getInterestLevel(game.slateScore);
  
  // Map CSS classes to Tailwind classes based on interest level
  const interestLevelClasses: Record<string, string> = {
    "must-watch": "border-l-4 border-green-500 bg-white rounded-lg shadow-md h-40 w-[50rem] justify-around items-center relative z-0",
    "high-interest": "border-l-4 border-blue-500 bg-white rounded-lg shadow-md h-40 w-[50rem] justify-around items-center relative z-0",
    "decent": "border-l-4 border-amber-500 bg-white rounded-lg shadow-md h-40 w-[50rem] justify-around items-center relative z-0",
    "low-interest": "border-l-4 border-red-500 bg-white rounded-lg shadow-md h-40 w-[50rem] justify-around items-center relative z-0",
    "unknown-interest": "border-l-4 border-gray-500 bg-white rounded-lg shadow-md h-40 w-[50rem] justify-around items-center relative z-0"
  };

  const headerClasses: Record<string, string> = {
    "must-watch": "w-[calc(50rem-4px)] h-full rounded-lg text-base font-semibold z-10 flex flex-col justify-center items-center gap-4 bg-green-100 text-green-800",
    "high-interest": "w-[calc(50rem-4px)] h-full rounded-lg text-base font-semibold z-10 flex flex-col justify-center items-center gap-4 bg-blue-100 text-blue-800",
    "decent": "w-[calc(50rem-4px)] h-full rounded-lg text-base font-semibold z-10 flex flex-col justify-center items-center gap-4 bg-amber-100 text-amber-800",
    "low-interest": "w-[calc(50rem-4px)] h-full rounded-lg text-base font-semibold z-10 flex flex-col justify-center items-center gap-4 bg-red-100 text-red-800",
    "unknown-interest": "w-[calc(50rem-4px)] h-full rounded-lg text-base font-semibold z-10 flex flex-col justify-center items-center gap-4 bg-gray-300 text-gray-500"
  };

  return (
    <div className={interestLevelClasses[interestLevel.className]}>
      <div className={headerClasses[interestLevel.className]}>
        <div className="text-2xl w-20 flex justify-center items-center mr-[calc(50rem-5rem)]">
          {interestLevel.rating}
        </div>
      </div>
      <div className="w-[calc(50rem-5rem)] h-40 ml-20 z-20 bg-white rounded-lg shadow-md flex flex-row items-center">
        {/* League logo could be added here if needed */}
        <div className="h-full flex flex-col gap-4 flex-grow">
          <div className="flex-grow flex flex-row items-center justify-center gap-8 py-5 text-center relative">
            <TeamInfo homeAway="away" team={game.away} />
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 text-2xl">@</div>
              {showGameTime && (
                <div className="text-sm">
                  {formatGameTime(game.date)}
                </div>
              )}
            </div>
            <TeamInfo homeAway="home" team={game.home} />
            <div className="absolute bottom-[-0.5rem] w-[90%] border-b border-gray-200"></div>
          </div>
          <Broadcasts broadcasts={game.broadcasts} />
        </div>
      </div>
    </div>
  );
};

const TeamInfo: React.FC<TeamInfoProps> = ({ homeAway, team }) => {
  return (
    <div className={`flex-1 flex flex-col ${homeAway === "away" ? "" : ""}`}>
      <div className={`flex flex-row items-center gap-4 ${
        homeAway === "away" 
          ? "justify-end ml-4" 
          : "justify-start mr-4"
      }`}>
        <div className="flex-grow">
          <div className="text-2xl font-bold">{team.shortName}</div>
          <div className="flex flex-col justify-right">
            <span className="text-sm">({team.record})</span>
            {team.matchupQualities && (
              <span className="text-sm">
                {team.matchupQualities.teampredwinpct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <img 
          className={`w-16 h-16 flex-col items-center ${homeAway === "home" ? "order-first" : ""}`} 
          src={team.logo.split(".com")[1]} 
          alt="" 
        />
      </div>
    </div>
  );
};

const Broadcasts: React.FC<BroadcastsProps> = ({ broadcasts }) => {
  if (!Object.keys(broadcasts).length) {
    return (
      <div className="flex flex-row flex-wrap justify-center gap-2 mb-2 text-xs text-gray-600">
        <span className="flex text-center items-center italic">No Broadcasts Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-wrap justify-center gap-2 mb-2 text-xs text-gray-600">
      {Object.keys(broadcasts).map((broadcast, index) => (
        <span 
          key={index} 
          id={index.toString()} 
          className="w-fit text-center font-bold bg-gray-100 py-1 px-3 border border-gray-300 rounded-full"
        >
          {broadcast}
        </span>
      ))}
    </div>
  );
};

export default GameCard;