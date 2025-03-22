import React from "react";
import { getInterestLevel, formatGameTime } from "../../../helpers";
import { GameCardProps } from "../types";
import { Provider, useAuth } from '../../../contexts/AuthContext';
import { FirebaseImg } from "../../General/FirebaseImg";

// Interest level styling (now only using the background colors)
const interestLevelClasses: Record<string, string[]> = {
  "favorite": ["", "bg-yellow-100 text-yellow-800"],
  "must-watch": ["", "bg-green-100 text-green-800"],
  "high-interest": ["", "bg-blue-100 text-blue-800"],
  "decent": ["", "bg-orange-100 text-orange-800"],
  "low-interest": ["", "bg-red-100 text-red-800"],
  "unknown-interest": ["", "bg-gray-300 text-gray-500"]
};

// Helper function to map broadcast to channel
const mapBroadcastToChannel = (broadcast: string, tvChannels: Record<string, Provider>) => {
  const mappedChannels: Record<string, string>[] = [];
  Object.entries(tvChannels).forEach(([providerId, provider]) => {
    Object.entries(provider).forEach(([channelId, channel]) => {
      if (channel.names.commonName === broadcast) {
        mappedChannels.push({
          providerId,
          channelId,
          name: broadcast,
          number: channel.number,
          logo: channel.logo,
        });
      }
    });
  });

  if (mappedChannels.length === 0) {
    return [{ channelId: broadcast, name: broadcast }];
  } else {
    return mappedChannels;
  }
}

const RefinedGameCard: React.FC<GameCardProps> = ({ game, showGameTime }) => {
  const { userPreferences, tvChannels } = useAuth();
  const favoriteTeams = userPreferences.favoriteTeams || [];
  const isFavoriteGame = favoriteTeams.some(favoriteTeam =>
    game.sport === favoriteTeam.sport && [game.home.id, game.away.id].includes(favoriteTeam.id)
  );
  const interestLevel = getInterestLevel(game.slateScore, isFavoriteGame);
  const [expanded, setExpanded] = React.useState(false);

  // Get broadcast channels
  const broadcastChannels = React.useMemo(() => {
    if (!Object.keys(game.broadcasts).length) return [];
    
    return Object.keys(game.broadcasts).flatMap(broadcast => {
      const mappedChannels = mapBroadcastToChannel(broadcast, tvChannels);
      return mappedChannels.map(channel => ({
        key: channel.channelId,
        text: channel.number ? `${channel.name}: ${channel.number}` : channel.name
      }));
    });
  }, [game.broadcasts, tvChannels]);

  return (
    <div className={`${isFavoriteGame ? "order-[-1]" : ""} w-full cursor-pointer transition-all py-2 border-b border-gray-200 last:border-b-0`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main card - always visible */}
      <div className="flex items-center">
        {/* Slate Score */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold mr-4 ${interestLevelClasses[interestLevel.className][1]}`}>
          {interestLevel.rating}
        </div>
        
        {/* Teams and Game Status */}
        <div className="flex-1 flex items-center">
          {/* Away Team */}
          <div className="flex items-center gap-3 justify-end min-w-[200px]">
            <div className="text-right">
              <div className="font-bold">{game.away.shortName}</div>
              {game.away.shortName !== "TBD" && (
                <div className="text-xs text-gray-600">
                  <span>({game.away.record})</span>
                  {game.away.matchupQualities && game.home.shortName !== "TBD" && (
                    <span className="ml-1">• {game.away.matchupQualities.teampredwinpct.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="w-10 h-10 flex-shrink-0">
              <FirebaseImg
                src={game.away.logo || "i/teamlogos/tbd.png"}
                alt={`${game.away.shortName} logo`}
                loading="lazy"
              />
            </div>
          </div>
          
          {/* Game Status - centered */}
          <div className="flex-shrink-0 mx-6 text-center">
            <div className="text-lg font-medium">@</div>
            {showGameTime && <div className="text-xs">{formatGameTime(game.date)}</div>}
          </div>
          
          {/* Home Team */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 flex-shrink-0">
              <FirebaseImg
                src={game.home.logo || "i/teamlogos/tbd.png"}
                alt={`${game.home.shortName} logo`}
                loading="lazy"
              />
            </div>
            <div>
              <div className="font-bold">{game.home.shortName}</div>
              {game.home.shortName !== "TBD" && (
                <div className="text-xs text-gray-600">
                  {game.home.matchupQualities && game.away.shortName !== "TBD" && (
                    <span className="mr-1">{game.home.matchupQualities.teampredwinpct.toFixed(0)}% •</span>
                  )}
                  <span>({game.home.record})</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Broadcasts - always visible */}
        <div className="flex-grow flex items-center justify-end ml-6">
          {broadcastChannels.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-end">
              {broadcastChannels.map(channel => (
                <span
                  key={channel.key}
                  className="text-xs bg-gray-100 py-0.5 px-2 border border-gray-200 rounded-full whitespace-nowrap"
                >
                  {channel.text}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-500 italic">No Broadcasts</span>
          )}
        </div>
      </div>
      
      {/* Expandable section for game notes */}
      {expanded && game.notes && game.notes[0]?.headline && (
        <div className="pt-2 ml-16">
          <div className="text-xs text-gray-600">
            {game.notes[0].headline}
          </div>
        </div>
      )}
    </div>
  );
};

export default RefinedGameCard;