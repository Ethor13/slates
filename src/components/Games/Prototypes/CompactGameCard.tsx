import React from "react";
import { getInterestLevel, formatGameTime } from "../../../helpers";
import { GameCardProps } from "../types";
import { Provider, useAuth } from '../../../contexts/AuthContext';
import { FirebaseImg } from "../../General/FirebaseImg";

// Interest level styling
const interestLevelClasses: Record<string, string[]> = {
  "favorite": ["border-yellow-500", "bg-yellow-100 text-yellow-800"],
  "must-watch": ["border-green-500", "bg-green-100 text-green-800"],
  "high-interest": ["border-blue-500", "bg-blue-100 text-blue-800"],
  "decent": ["border-orange-500", "bg-orange-100 text-orange-800"],
  "low-interest": ["border-red-500", "bg-red-100 text-red-800"],
  "unknown-interest": ["border-gray-500", "bg-gray-300 text-gray-500"]
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

const CompactGameCard: React.FC<GameCardProps> = ({ game, showGameTime }) => {
  const { userPreferences, tvChannels } = useAuth();
  const favoriteTeams = userPreferences.favoriteTeams || [];
  const isFavoriteGame = favoriteTeams.some(favoriteTeam =>
    game.sport === favoriteTeam.sport && [game.home.id, game.away.id].includes(favoriteTeam.id)
  );
  const interestLevel = getInterestLevel(game.slateScore, isFavoriteGame);

  return (
    <div className={`${isFavoriteGame ? "order-[-1]" : ""} border-l-4 bg-white rounded-lg shadow-sm w-full max-w-[50rem] relative ${interestLevelClasses[interestLevel.className][0]}`}>
      <div className="flex items-center px-3 py-2">
        {/* Slate Score */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold ${interestLevelClasses[interestLevel.className][1]}`}>
          {interestLevel.rating}
        </div>
        
        {/* Game Info */}
        <div className="flex flex-1 items-center mx-3">
          {/* Away Team */}
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 mr-2">
              <FirebaseImg
                src={game.away.logo || "i/teamlogos/tbd.png"}
                alt={`${game.away.shortName} logo`}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <div className="font-bold">{game.away.shortName}</div>
              {game.away.shortName !== "TBD" && (
                <div className="text-xs text-gray-600 flex gap-2">
                  <span>({game.away.record})</span>
                  {game.away.matchupQualities && game.home.shortName !== "TBD" && (
                    <span>{game.away.matchupQualities.teampredwinpct.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Game Time/Status */}
          <div className="flex flex-col items-center mx-2 min-w-[60px] text-center">
            <span className="text-xl font-medium">@</span>
            {showGameTime && <span className="text-xs">{formatGameTime(game.date)}</span>}
          </div>
          
          {/* Home Team */}
          <div className="flex items-center flex-1 justify-end">
            <div className="flex flex-col items-end">
              <div className="font-bold">{game.home.shortName}</div>
              {game.home.shortName !== "TBD" && (
                <div className="text-xs text-gray-600 flex gap-2 justify-end">
                  <span>({game.home.record})</span>
                  {game.home.matchupQualities && game.away.shortName !== "TBD" && (
                    <span>{game.home.matchupQualities.teampredwinpct.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="w-10 h-10 ml-2">
              <FirebaseImg
                src={game.home.logo || "i/teamlogos/tbd.png"}
                alt={`${game.home.shortName} logo`}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Broadcasts & Notes */}
      <div className="px-3 pb-2 pt-0">
        {/* Game Notes */}
        {game.notes && game.notes[0]?.headline && (
          <div className="w-full text-xs text-gray-600 text-center mb-1 truncate">
            {game.notes[0].headline}
          </div>
        )}
        
        {/* Broadcasts */}
        <div className="flex flex-wrap justify-center gap-1">
          {Object.keys(game.broadcasts).length > 0 ? (
            Object.keys(game.broadcasts).map(broadcast => {
              const mappedChannels = mapBroadcastToChannel(broadcast, tvChannels);
              return mappedChannels.map(channel => (
                <span
                  key={channel.channelId}
                  id={channel.channelId}
                  className="text-xs text-center font-medium bg-gray-100 py-0.5 px-2 border border-gray-200 rounded-full"
                >
                  {channel.number ? `${channel.name}: ${channel.number}` : channel.name}
                </span>
              ));
            })
          ) : (
            <span className="text-xs text-gray-500 italic">No Broadcasts Available</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactGameCard;