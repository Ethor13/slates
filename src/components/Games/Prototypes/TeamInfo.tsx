import React from "react";
import { FirebaseImg } from "../../General/FirebaseImg";
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
    <div className={`flex items-center gap-2 w-full ${isAway ? 'justify-end' : 'justify-start'}`}>
      {isAway ? (
        <>
          <div className="text-right overflow-hidden">
            <div className="font-bold truncate">{team.shortName}</div>
            {!isTBD && (
              <div className="text-xs text-gray-600 truncate">
                <span>({team.record})</span>
                {team.matchupQualities && !isOpponentTBD && (
                  <span className="ml-1">• {team.matchupQualities.teampredwinpct.toFixed(0)}%</span>
                )}
              </div>
            )}
          </div>
          <div className="w-10 h-10 flex-shrink-0">
            <FirebaseImg
              src={team.logo || "i/teamlogos/tbd.png"}
              alt={`${team.shortName} logo`}
              loading="lazy"
            />
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 flex-shrink-0">
            <FirebaseImg
              src={team.logo || "i/teamlogos/tbd.png"}
              alt={`${team.shortName} logo`}
              loading="lazy"
            />
          </div>
          <div className="overflow-hidden">
            <div className="font-bold truncate">{team.shortName}</div>
            {!isTBD && (
              <div className="text-xs text-gray-600 truncate">
                {team.matchupQualities && !isOpponentTBD && (
                  <span className="mr-1">{team.matchupQualities.teampredwinpct.toFixed(0)}% •</span>
                )}
                <span>({team.record})</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamInfo;