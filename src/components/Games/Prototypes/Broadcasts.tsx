import React from "react";
import { Provider } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';

interface BroadcastChannelProps {
  text: string;
}

const BroadcastChannel: React.FC<BroadcastChannelProps> = ({ text }) => (
  <span className="text-xs bg-gray-100 py-0.5 px-2 border border-gray-200 rounded-full whitespace-nowrap overflow-hidden text-ellipsis">
    {text}
  </span>
);

// Helper function to map broadcast to channel for a specific provider
const mapBroadcastToChannelForProvider = (broadcast: string, provider: Provider) => {
  const mappedChannels: Record<string, any>[] = [];
  
  Object.entries(provider).forEach(([channelId, channel]) => {
    if (channel.names.commonName === broadcast) {
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
}

const Broadcasts: React.FC<BroadcastsProps> = ({ broadcasts, tvChannels }) => {
  const { userPreferences } = useAuth();

  // Get broadcast channels grouped by provider
  const broadcastsByProvider = React.useMemo(() => {
    if (!Object.keys(broadcasts).length) return new Map();
    
    const providerBroadcasts = new Map<string, Array<{ key: string; text: string }>>();
    
    // Only process providers that the user has selected
    Object.keys(userPreferences.tvProviders).forEach(providerId => {
      const provider = tvChannels[providerId];
      if (!provider) return;
      
      const channelsForProvider: Array<{ key: string; text: string }> = [];
      
      Object.keys(broadcasts).forEach(broadcast => {
        const mappedChannels = mapBroadcastToChannelForProvider(broadcast, provider);
        channelsForProvider.push(
          ...mappedChannels.map(channel => ({
            key: channel.channelId,
            text: channel.number ? `${channel.name}: ${channel.number}` : channel.name
          }))
        );
      });
      
      if (channelsForProvider.length > 0) {
        providerBroadcasts.set(providerId, channelsForProvider);
      }
    });
    
    return providerBroadcasts;
  }, [broadcasts, tvChannels, userPreferences.tvProviders]);

  return (
    <div className="w-full overflow-hidden">
      {broadcastsByProvider.size > 0 ? (
        Array.from(broadcastsByProvider.entries()).map(([providerId, channels]) => (
          <div key={providerId} className="flex flex-wrap items-center gap-1 mb-1">
            <span className="text-sm font-medium text-gray-600 truncate">
              {userPreferences.tvProviders[providerId]}:
            </span>
            <div className="flex flex-wrap gap-1">
              {channels.slice(0, 2).map((channel: { key: string; text: string }) => (
                <BroadcastChannel
                  key={channel.key}
                  text={channel.text}
                />
              ))}
              {channels.length > 2 && (
                <span className="text-xs text-gray-500">+{channels.length - 2}</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <span className="text-xs text-gray-500 italic">No Broadcasts</span>
      )}
    </div>
  );
};

export default Broadcasts;