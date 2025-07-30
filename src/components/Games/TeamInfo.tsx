import React, { useState, useEffect } from "react";
import { TeamColorBlock } from "../General/TeamColorBlock";
import { Team } from "./types";

interface TeamInfoProps {
  team: Team;
  opponent?: Team;
  isAway: boolean;
}

const MOBILE_THRESHOLD = 640;

const TeamInfo: React.FC<TeamInfoProps> = ({ team, isAway }) => {
  const isTBD = team.shortName === "TBD";
  const [effectiveIsAway, setEffectiveIsAway] = useState(window.innerWidth < MOBILE_THRESHOLD ? !isAway : isAway);

  // Handle responsive behavior for isAway property
  useEffect(() => {
    const handleResize = () => {
      // Tailwind md breakpoint is 768px
      const isMobile = window.innerWidth < MOBILE_THRESHOLD;
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
    <div className={`w-full flex h-full items-center`}>
      {effectiveIsAway ?
        <div className="h-10 w-10 print:w-6 print:h-6 flex-shrink-0 order-last sm:order-first">
          <TeamColorBlock colors={team.colors} leftToRight={effectiveIsAway} reverse={true} />
        </div> :
        <></>
      }
      <div className="w-full h-full flex flex-col justify-center text-center overflow-hidden">
        <div className="text-lg print:text-sm md:text-base font-semibold truncate">{team.shortName}</div>
        {!isTBD && (
          <div className="text-xs text-[clamp(0.75rem,1.5rem)] text-gray-600 truncate print:hidden">
            <span>{team.record}</span>
          </div>
        )}
      </div>
      {!effectiveIsAway ?
        <div className="h-10 w-10 print:w-6 print:h-6 flex-shrink-0 flex justify-end">
          <TeamColorBlock colors={team.colors} leftToRight={effectiveIsAway} reverse={false} />
        </div> :
        <></>
      }
    </div>
  );
};

export default TeamInfo;