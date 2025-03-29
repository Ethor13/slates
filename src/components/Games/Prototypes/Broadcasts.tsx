import React from "react";
import { useMemo } from "react";
import { Provider } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';

// Helper function to map broadcast to channel for a specific provider
const mapBroadcastToChannelForProvider = (broadcast: string, provider: Provider) => {
  const mappedChannels: Record<string, any>[] = [];

  Object.entries(provider).forEach(([channelId, channel]) => {
    const lowercaseBroadcast = broadcast.toLowerCase();
    const lowercaseChannelName = channel.names.commonName.toLowerCase();

    const commonNameMatch = lowercaseBroadcast === lowercaseChannelName;
    const hdMatch = lowercaseChannelName === `${lowercaseBroadcast} hd`;
    if (commonNameMatch || hdMatch) {
      mappedChannels.push({
        channelId,
        name: broadcast,
        number: channel.number,
        logo: channel.logo,
      });
    }
  });

  return mappedChannels;
}

export interface BroadcastsProps {
  broadcasts: Record<string, any>;
  tvChannels: Record<string, Provider>;
  gameId?: string; // Optional game ID to identify the row
}

// Component for displaying broadcast information in a table layout
// Now designed for a single game's broadcasts
const Broadcasts: React.FC<BroadcastsProps> = ({ broadcasts, tvChannels, gameId }) => {
  const { userPreferences } = useAuth();

  // Create a mapping of broadcasts to display in table format
  const broadcastChannels = useMemo(() => {
    // Get list of all broadcast names
    const broadcastNames = Object.keys(broadcasts);
    if (broadcastNames.length === 0) return [];

    // Get list of providers with their IDs and names
    const providers = Object.entries(userPreferences.tvProviders)
      .map(([providerId, providerName]) => ({
        id: providerId,
        name: providerName,
        provider: tvChannels[providerId]
      }))
      .filter(item => item.provider); // Only include providers that exist in tvChannels

    // Create broadcast rows with channel numbers for each provider
    return broadcastNames.map(broadcastName => {
      const channelsForBroadcast: Record<string, string> = {};

      // Find channel number for each provider
      providers.forEach(({ id, provider }) => {
        const mappedChannels = mapBroadcastToChannelForProvider(broadcastName, provider);
        // Use the first channel number if there are multiple matches
        channelsForBroadcast[id] = mappedChannels.length > 0 ? (mappedChannels[0].number || '') : '';
      });

      return {
        broadcastName,
        channels: channelsForBroadcast
      };
    });
  }, [broadcasts, tvChannels, userPreferences.tvProviders]);

  // If no broadcasts, show empty state
  if (broadcastChannels.length === 0) {
    return <span className="text-xs text-gray-500 italic">No Broadcasts</span>;
  }

  return (
    <div className="w-full flex flex-col">
      {broadcastChannels.map((broadcast) => (
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
      ))}
    </div>
  );
};

// New component that renders the TV provider headers once at the top of the games list
export interface BroadcastsHeaderProps {
  tvChannels?: Record<string, Provider>;
}

export const BroadcastsHeader: React.FC<BroadcastsHeaderProps> = () => {
  const { userPreferences } = useAuth();

  // If no providers, don't show the header
  if (Object.keys(userPreferences.tvProviders).length === 0) {
    return null;
  }

  return (
    <div className="pl-[calc(2rem+50%)] w-full border-b border-gray-200">
      <div className="flex items-center">
        <div className="w-[10rem] font-medium text-right text-black">
          Broadcast
        </div>
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
      </div>
    </div>
  );
};

export default Broadcasts;