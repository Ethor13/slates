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
    if (Object.keys(tvChannels).length) {
      setInitialized(true);
    }
  }, [tvChannels]);

  return (
    <div className="pl-[1rem] w-full h-full divide-x flex flex-row">
      <div className="h-full flex-grow-[2] basis-0 flex-col justify-center flex">
        {broadcastChannels.length ? broadcastChannels.map((broadcast) => (
          <div
            key={`${gameId}-${broadcast.broadcastName}`}
            className="h-full flex flex-row text-sm divide-x items-center"
          >
            <div className="h-full flex-1 basis-0 text-center flex items-center justify-center min-w-0">
              <span className="text-sm truncate w-full px-1">{broadcast.broadcastName}</span>
            </div>
            {Object.entries(userPreferences.tvProviders).map(([providerId]) => (
              <div
                key={`${gameId}-${broadcast.broadcastName}-${providerId}`}
                className="h-full flex-1 basis-0 text-center flex items-center justify-center"
              >
                {broadcast.channels[providerId] ? (
                  <span className="text-sm flex items-center justify-center">
                    <span>{broadcast.channels[providerId]}</span>
                  </span>
                ) : (
                  <span className="text-gray-600"></span>
                )}
              </div>
            ))}
          </div>
        )) :
          <></>
        }
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        {nonTvChannels.length ? nonTvChannels.map((broadcast) => (
          <div
            key={`${gameId}-${broadcast}`}
            className="text-sm text-center"
          >
            {broadcast}
          </div>
        )) :
          <></>
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
    <div className="pl-[3rem] grid grid-cols-10 w-full">
      <div className="col-span-5"></div>
      <div className="col-span-5 flex items-center text-base font-medium text-black h-8 divide-x">
        <div className="pl-4 h-full flex-grow-[2] basis-0 flex divide-x">
          <div className="flex-1 w-full h-full flex items-center justify-center">
            <span>Broadcast</span>
          </div>
          {Object.entries(userPreferences.tvProviders).map(([providerId, providerName]) => (
            <div
              key={`header-${providerId}`}
              className="min-w-0 flex-1 h-full flex items-center justify-center"
            >
              {/* Display shortened provider name */}
              <span className="overflow-visible whitespace-nowrap">{providerName.split(' - ')[0]}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 h-full flex items-center justify-center"><span>Streaming</span></div>
      </div>
    </div>
  );
};

export default Broadcasts;