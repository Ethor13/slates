import React, { useEffect } from "react";
import { Provider } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import broadcastMapper from './broadcastMapper.json';

// Helper function to map broadcast to channel for a specific provider
const mapBroadcastToChannelForProvider = (broadcast: string, provider: Provider) => {
  const mappedChannels: Record<string, any>[] = [];

  // Find the broadcast in the mapper
  const mapperEntry = Object.entries(broadcastMapper).find(([key]) => key.toLowerCase() === broadcast.toLowerCase());

  if (mapperEntry) {
    const regexPattern = mapperEntry[1].tvGuideName;

    // Skip if tvGuideName is null
    if (regexPattern) {
      // Use the tvGuideName as a regex pattern to match channel names
      Object.entries(provider).forEach(([channelId, channel]) => {
        let channelName = channel.names.fullName.replace(/ HD$/i, '');
        try {
          const regex = new RegExp(regexPattern, 'i');
          if (regex.test(channelName)) {
            mappedChannels.push({
              channelId,
              name: broadcast,
              number: channel.number,
              logo: channel.logo,
            });
          }
        } catch (e) {
          // If regex is invalid, just do a simple includes check
          if (channelName.toLowerCase().includes(regexPattern.toLowerCase())) {
            mappedChannels.push({
              channelId,
              name: broadcast,
              number: channel.number,
              logo: channel.logo,
            });
          }
        }
      });
    } else {
      console.log(`Skipping broadcast ${broadcast} mapping due to null tvGuideName`);
    }
  } else {
    // Eventually log this to firebase
    console.error(`Broadcast "${broadcast}" not found in mapper.`);
  }

  return mappedChannels;
}

export interface BroadcastsProps {
  broadcasts: Record<string, any>;
  gameId?: string; // Optional game ID to identify the row
}

// Component for displaying broadcast information in a table layout
// Now designed for a single game's broadcasts
const Broadcasts: React.FC<BroadcastsProps> = ({ broadcasts, gameId }) => {
  const { userPreferences, tvChannels } = useAuth();
  const [broadcastChannels, setBroadcastChannels] = React.useState<any[]>([]);
  const [nonTvChannels, setnonTvChannels] = React.useState<any[]>([]);

  // Create a mapping of broadcasts to display in table format
  useEffect(() => {
    // Get list of all broadcast names
    const broadcastNames = Object.entries(broadcasts).filter(([_, broadcast]) => broadcast.type === "TV").map(([broadcastName, _]) => broadcastName);
    if (broadcastNames.length === 0) {
      setBroadcastChannels([]);
      return;
    }
    const providerId = userPreferences.tvProviders;
    const providers = providerId ? [{ id: providerId, name: providerId, provider: tvChannels[providerId] }] : [];
    const allBroadcasts = broadcastNames.map(broadcastName => {
      const channelsForBroadcast: Record<string, string> = {};
      providers.forEach(({ id, provider }) => {
        if (!provider) return;
        const mappedChannels = mapBroadcastToChannelForProvider(broadcastName, provider);
        channelsForBroadcast[id] = mappedChannels.length > 0 ? [...new Set(mappedChannels.map(channel => channel.number))].join(', ') : '';
      });
      return {
        broadcastName,
        channels: channelsForBroadcast,
        hasAnyChannels: Object.values(channelsForBroadcast).some(channel => channel !== '')
      };
    });
    if (userPreferences.showOnlyAvailableBroadcasts) {
      setBroadcastChannels(allBroadcasts.filter(broadcast => broadcast.hasAnyChannels));
    } else {
      setBroadcastChannels(allBroadcasts);
    }
  }, [broadcasts, tvChannels, userPreferences.tvProviders, userPreferences.showOnlyAvailableBroadcasts]);

  useEffect(() => {
    // Get list of all broadcast names
    setnonTvChannels(Object.entries(broadcasts).filter(([_, broadcast]) => broadcast.type !== "TV").map(([broadcastName, _]) => broadcastName));
  }, [broadcasts]);

  return (
    <div className="print:pl-[0.5rem] w-full h-full divide-x flex flex-row">
      <div className="h-full flex-grow-[2] basis-0 flex-row justify-center flex divide-x">
        <div className="flex flex-1 min-w-0 flex-col ">
          {broadcastChannels.length ? broadcastChannels.map((broadcast) => (
            <div key={`${gameId}-${broadcast.broadcastName}`} className="h-full flex-1 basis-0 text-center flex items-center justify-center min-w-0">
              <span className="text-sm print:text-xs leading-none truncate w-full px-1">{broadcast.broadcastName}</span>
            </div>
          )) : <></>}
        </div>
        {userPreferences.tvProviders && (
          <div className="flex flex-1 min-w-0 flex-col">
            {broadcastChannels.length ? broadcastChannels.map((broadcast) => (
              <div
                key={`${gameId}-${broadcast.broadcastName}-${userPreferences.tvProviders}`}
                className="h-full flex-1 basis-0 text-center flex items-center justify-center min-w-0"
              >
                {broadcast.channels[userPreferences.tvProviders] ? (
                  <span className="text-sm print:text-xs leading-none flex items-center justify-center w-full min-w-0 px-1">
                    <span className="truncate w-full min-w-0 whitespace-nowrap overflow-hidden">
                      {broadcast.channels[userPreferences.tvProviders]}
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-600"></span>
                )}
              </div>
            )) : <></>}
          </div>
        )}
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center">
          {nonTvChannels.length ? nonTvChannels.map((broadcast) => (
            <div
              key={`${gameId}-${broadcast}`}
              className="text-sm print:text-xs text-center w-full px-1 min-w-0"
            >
              <span className="truncate w-full block whitespace-nowrap overflow-hidden">{broadcast}</span>
            </div>
          )) : <></>}
        </div>
      </div>
    </div>
  );
};

export const BroadcastsHeader: React.FC = () => {
  const { userPreferences } = useAuth();
  if (!userPreferences.tvProviders) {
    return null;
  }
  return (
    <div className="w-full grid pl-[3.5rem] print:pl-[3rem] xl:grid-cols-[8fr_4rem_10fr] print:grid-cols-[6fr_2rem_6fr] items-center">
      <div />
      <div />
      <div className="print:pl-[2px] flex items-center text-base print:text-sm font-medium text-black divide-x">
        <div className="h-full flex-grow-[2] basis-0 flex divide-x w-full min-w-0">
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <span>Channel</span>
          </div>
          <div className="min-w-0 flex-1 h-full flex items-center justify-center">
            <span className="h-full w-full truncate text-center px-1">Number</span>
          </div>
          <div className="flex-1 h-full flex items-center justify-center min-w-0"><span className="truncate px-1">Streams</span></div>
        </div>
      </div>
    </div>
  );
};

export default Broadcasts;