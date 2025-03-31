import React, { useEffect } from "react";
import { Provider } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';
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
  const [initialized, setInitialized] = React.useState(false);

  // Create a mapping of broadcasts to display in table format
  useEffect(() => {
    // Get list of all broadcast names
    const broadcastNames = Object.entries(broadcasts).filter(([_, broadcast]) => broadcast.type === "TV").map(([broadcastName, _]) => broadcastName);
    if (broadcastNames.length === 0) {
      setBroadcastChannels([]);
      return;
    }

    // Get list of providers with their IDs and names
    const providers = Object.entries(userPreferences.tvProviders)
      .map(([providerId, providerName]) => ({
        id: providerId,
        name: providerName,
        provider: tvChannels[providerId]
      }))
      .filter(item => item.provider); // Only include providers that exist in tvChannels

    // Create broadcast rows with channel numbers for each provider
    const allBroadcasts = broadcastNames.map(broadcastName => {
      const channelsForBroadcast: Record<string, string> = {};

      // Find channel number for each provider
      providers.forEach(({ id, provider }) => {
        const mappedChannels = mapBroadcastToChannelForProvider(broadcastName, provider);
        // Use the first channel number if there are multiple matches
        channelsForBroadcast[id] = mappedChannels.length > 0 ? [...new Set(mappedChannels.map(channel => channel.number))].join(', ') : '';
      });

      return {
        broadcastName,
        channels: channelsForBroadcast,
        // Track if this broadcast has any channels across all providers
        hasAnyChannels: Object.values(channelsForBroadcast).some(channel => channel !== '')
      };
    });

    // Filter broadcasts if showOnlyAvailableBroadcasts is enabled
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

  useEffect(() => {
    if (tvChannels.length) {
      setInitialized(true);
    }
  }, [tvChannels]);

  return (
    <div className="w-full h-full divide-x flex flex-row">
      <div className="flex flex-col justify-center">
        {broadcastChannels.length ? broadcastChannels.map((broadcast) => (
          <div
            key={`${gameId}-${broadcast.broadcastName}`}
            className="flex flex-row text-sm"
          >
            <div className="w-[10rem] text-black pr-2 text-right whitespace-nowrap overflow-hidden text-ellipsis">
              {broadcast.broadcastName}
            </div>
            <div className="flex flex-row">
              {Object.entries(userPreferences.tvProviders).map(([providerId]) => (
                <div
                  key={`${gameId}-${broadcast.broadcastName}-${providerId}`}
                  className="flex-1 text-center w-[10rem]"
                >
                  {broadcast.channels[providerId] ? (
                    <span className="text-sm">
                      {broadcast.channels[providerId]}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )) :
          <div className={`text-sm text-center italic text-gray-600 min-w-[${(1 + Object.keys(userPreferences.tvProviders).length) * 10}rem]`}>{initialized ? "No broadcasts available" : ""}</div>
        }
      </div>
      <div className="flex flex-col items-center justify-center">
        {nonTvChannels.length ? nonTvChannels.map((broadcast) => (
          <div
            key={`${gameId}-${broadcast}`}
            className="text-sm w-[10rem] text-center"
          >
            {broadcast}
          </div>
        )) :

          <div className={`text-sm text-center italic text-gray-600 min-w-[10rem]`}>No streams available</div>
        }
      </div>
    </div>
  );
};

export const BroadcastsHeader: React.FC = () => {
  const { userPreferences } = useAuth();

  // If no providers, don't show the header
  if (Object.keys(userPreferences.tvProviders).length === 0) {
    return null;
  }

  return (
    <div className="pl-[4rem] grid grid-cols-10 w-full border-b border-gray-200">
      <div className="col-span-5"></div>
      <div className="col-span-5 flex items-center">
        <div className="w-[10rem] pr-2 font-medium text-right text-black">
          Broadcast
        </div>
        <div className="divide-x flex flex-row">
          <div className="flex-1 flex">
            {Object.entries(userPreferences.tvProviders).map(([providerId, providerName]) => (
              <div
                key={`header-${providerId}`}
                className="font-medium text-black w-[10rem] text-center"
              >
                {/* Display shortened provider name */}
                {providerName.split(' - ')[0]}
              </div>
            ))}
          </div>
          <div className="font-medium text-black w-[10rem] text-center">
            Streaming
          </div>
        </div>
      </div>
    </div>
  );
};

export default Broadcasts;