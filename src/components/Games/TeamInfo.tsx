import React from "react";
import { TeamColorBlock } from "../General/TeamColorBlock";
import { Team } from "./types";

interface TeamInfoProps {
  team: Team;
  opponent?: Team;
  isAway: boolean;
}

const TeamInfo: React.FC<TeamInfoProps> = ({ team, isAway }) => {
  const isTBD = team.shortName === "TBD";

  return (
    <div className={`w-full flex h-full items-center`}>
      {isAway ?
        <div className="h-10 w-10 print:w-6 print:h-6 flex-shrink-0">
          <TeamColorBlock colors={team.colors} leftToRight={isAway} reverse={true} />
        </div> :
        <></>
      }
      <div className="w-full h-full flex flex-col justify-center text-center overflow-hidden">
        <div className="text-sm print:text-sm md:text-base font-semibold truncate">{team.shortName}</div>
        {!isTBD && (
          <div className="text-xs text-[clamp(0.75rem,1.5rem)] text-gray-600 truncate print:hidden">
            <span>{team.record}</span>
          </div>
        )}
      </div>
      {!isAway ?
        <div className="h-10 w-10 print:w-6 print:h-6 flex-shrink-0 flex justify-end">
          <TeamColorBlock colors={team.colors} leftToRight={isAway} reverse={false} />
        </div> :
        <></>
      }
    </div>
  );
};

export default TeamInfo;