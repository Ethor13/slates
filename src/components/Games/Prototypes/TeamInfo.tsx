import React from "react";
import { TeamColorBlock } from "../../General/TeamColorBlock";
import { Team } from "../types";

interface TeamInfoProps {
  team: Team;
  opponent?: Team;
  isAway: boolean;
}

const TeamInfo: React.FC<TeamInfoProps> = ({ team, opponent, isAway }) => {
  const isTBD = team.shortName === "TBD";
  const isOpponentTBD = opponent?.shortName === "TBD";

  return (
    <div className={`flex items-center gap-2 w-full justify-between`}>
      <div className="w-10 h-10 flex-shrink-0">
        <TeamColorBlock colors={team.colors} leftToRight={isAway} reverse={true} />
      </div>
      <div className="flex flex-col text-center overflow-hidden">
        <div className="font-bold truncate">{team.shortName}</div>
        {!isTBD && (
          <div className="text-xs text-gray-600 truncate">
            <span>{team.record}</span>
            {team.matchupQualities && !isOpponentTBD && (
              <span className="ml-1">• {team.matchupQualities.teampredwinpct.toFixed(0)}%</span>
            )}
          </div>
        )}
      </div>
      <div className="w-10 h-10 flex-shrink-0">
        <TeamColorBlock colors={team.colors} leftToRight={isAway} reverse={false} />
      </div>
    </div>
  );
};

export default TeamInfo;