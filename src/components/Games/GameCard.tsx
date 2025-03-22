import React from "react";
import { getInterestLevel, formatGameTime } from "../../helpers";
import { GameCardProps, TeamInfoProps, BroadcastsProps } from "./types";
import { Provider, useAuth } from '../../contexts/AuthContext';
import { FirebaseImg } from "../General/FirebaseImg";

// First item is class for border, second is class for background
const interestLevelClasses: Record<string, string[]> = {
  "favorite": ["border-yellow-500", "bg-yellow-100 text-yellow-800"],
  "must-watch": ["border-green-500", "bg-green-100 text-green-800"],
  "high-interest": ["border-blue-500", "bg-blue-100 text-blue-800"],
  "decent": ["border-orange-500", "bg-orange-100 text-orange-800"],
  "low-interest": ["border-red-500", "bg-red-100 text-red-800"],
  "unknown-interest": ["border-gray-500", "bg-gray-300 text-gray-500"]
};

const TeamInfo: React.FC<TeamInfoProps> = ({ homeAway, team, opponent }) => {
  const isTBD = team.shortName === "TBD";
  const isOpponentTBD = opponent?.shortName === "TBD";

  return (
    <div className={`flex-1 flex flex-col ${homeAway === "away" ? "" : ""}`}>
      <div className={`flex flex-row items-center gap-4 ${homeAway === "away"
        ? "justify-end ml-4"
        : "justify-start mr-4"
        }`}>
        <div className="flex-grow">
          <div className="text-2xl font-bold">{team.shortName}</div>
          <div className="flex flex-col justify-right">
            {!isTBD && <span className="text-sm">({team.record})</span>}
            {!isTBD && !isOpponentTBD && team.matchupQualities && (
              <span className="text-sm">
                {team.matchupQualities.teampredwinpct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-16 h-16 ${homeAway === "home" ? "order-first" : ""}`}>
          <FirebaseImg
            src={team.logo || "i/teamlogos/tbd.png"}
            alt={`${team.shortName} logo`}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

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

const Broadcasts: React.FC<BroadcastsProps> = ({ broadcasts }) => {
  const { tvChannels } = useAuth();

  if (!Object.keys(broadcasts).length) {
    return (
      <div className="flex flex-row flex-wrap justify-center gap-2 mb-2 text-xs text-gray-600">
        <span className="flex text-center items-center italic">No Broadcasts Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-wrap justify-center gap-2 mb-2 text-xs text-gray-600">
      {Object.keys(broadcasts).map(broadcast => {
        const mappedChannels = mapBroadcastToChannel(broadcast, tvChannels);
        return mappedChannels.map(channel => (
          <span
            key={channel.channelId}
            id={channel.channelId}
            className="w-fit text-center font-bold bg-gray-100 py-1 px-3 border border-gray-300 rounded-full"
          >
            {channel.number ? `${channel.name}: ${channel.number}` : channel.name}
          </span>
        )
        )
      }
      )}
    </div>
  );
};


const GameCard: React.FC<GameCardProps> = ({ game, showGameTime }) => {
  const { userPreferences } = useAuth();
  const favoriteTeams = userPreferences.favoriteTeams || [];
  const isFavoriteGame = favoriteTeams.some(favoriteTeam =>
    game.sport === favoriteTeam.sport && [game.home.id, game.away.id].includes(favoriteTeam.id)
  );
  const interestLevel = getInterestLevel(game.slateScore, isFavoriteGame);

  return (
    <div className={`${isFavoriteGame ? "order-[-1]" : ""} border-l-4 bg-white rounded-lg shadow-all 0 w-[50rem] justify-around items-center relative ${interestLevelClasses[interestLevel.className][0]}`}>
      {/* Slate Score Indicator */}
      <div className={`w-[calc(50rem)] h-full rounded-lg text-base font-semibold flex absolute ${interestLevelClasses[interestLevel.className][1]}`}>
        <div className="text-2xl w-[5rem] flex justify-center items-center mr-[calc(50rem-5rem)]">
          {interestLevel.rating}
        </div>
      </div>

      {/* Main Gamecard Portion */}
      <div className="w-[calc(50rem-5rem)] h-40 ml-20 bg-white rounded-lg flex flex-row items-center relative z-10">
        <div className="h-full flex flex-col flex-grow">
          <div className="w-full text-center text-xs font-medium mt-1">
            {game.notes[0]?.headline}
          </div>
          <div className="flex-grow flex flex-row items-center justify-center gap-8 pb-4 text-center relative">
            <TeamInfo homeAway="away" team={game.away} opponent={game.home} />
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 text-2xl">@</div>
              {showGameTime && (
                <div className="text-sm">
                  {formatGameTime(game.date)}
                </div>
              )}
            </div>
            <TeamInfo homeAway="home" team={game.home} opponent={game.away} />
            <div className="absolute bottom-[0.5rem] w-[90%] border-b border-gray-200"></div>
          </div>
          <Broadcasts broadcasts={game.broadcasts} />
        </div>
      </div>
    </div>
  );
};

export default GameCard;