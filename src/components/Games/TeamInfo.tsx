import React, { useState, useEffect } from "react";
import { TeamColorBlock } from "../General/TeamColorBlock";
import { Team } from "./types";

interface TeamInfoProps {
  team: Team;
  opponent?: Team;
  isAway: boolean;
}

const TeamInfo: React.FC<TeamInfoProps> = ({ team, isAway }) => {
  const isTBD = team.shortName === "TBD";
  const [effectiveIsAway, setEffectiveIsAway] = useState(window.innerWidth < 768 ? !isAway : isAway);

  // Handle responsive behavior for isAway property
  useEffect(() => {
    const handleResize = () => {
      // Tailwind md breakpoint is 768px
      const isMobile = window.innerWidth < 768;
      setEffectiveIsAway(isMobile ? !isAway : isAway);
    };

    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [isAway]);

  return (
    <div className={`flex items-stretch justify-between`}>
      <div className="w-10 print:w-5 flex-shrink-0">
        <TeamColorBlock colors={team.colors} leftToRight={effectiveIsAway} reverse={true} />
      </div>
      <div className="flex flex-col text-center overflow-hidden">
        <div className="text-sm md:text-base font-bold truncate">{team.shortName}</div>
        {!isTBD && (
          <div className="text-xs text-[clamp(0.75rem,1.5rem)] text-gray-600 truncate print:hidden">
            <span>{team.record}</span>
          </div>
        )}
      </div>
      <div className="w-10 print:w-5 flex-shrink-0">
        <TeamColorBlock colors={team.colors} leftToRight={effectiveIsAway} reverse={false} />
      </div>
    </div>
  );
};

export default TeamInfo;