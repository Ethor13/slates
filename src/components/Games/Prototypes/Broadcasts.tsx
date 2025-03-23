import React from "react";
import { useMemo } from "react";
import { Provider } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';

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

  // Create a mapping of broadcasts to display in table format
  const tableData = useMemo(() => {
    // Get list of all broadcast names
    const broadcastNames = Object.keys(broadcasts);
    if (broadcastNames.length === 0) return { providers: [], broadcasts: [] };
    
    // Get list of providers with their IDs and names
    const providers = Object.entries(userPreferences.tvProviders)
      .map(([providerId, providerName]) => ({
        id: providerId,
        name: providerName,
        provider: tvChannels[providerId]
      }))
      .filter(item => item.provider); // Only include providers that exist in tvChannels
    
    // Create the channel mapping for each provider and broadcast
    const providerChannels = providers.map(providerInfo => {
      const { id, name, provider } = providerInfo;
      const channels: Record<string, string> = {};
      
      // For each broadcast, find the matching channel if any
      broadcastNames.forEach(broadcast => {
        const mappedChannels = mapBroadcastToChannelForProvider(broadcast, provider);
        if (mappedChannels.length > 0) {
          // Use the first channel number if there are multiple matches
          channels[broadcast] = mappedChannels[0].number || '';
        } else {
          channels[broadcast] = '';
        }
      });
      
      return {
        providerId: id,
        providerName: name,
        channels
      };
    });
    
    return {
      broadcasts: broadcastNames,
      providers: providerChannels
    };
  }, [broadcasts, tvChannels, userPreferences.tvProviders]);

  // If no broadcasts or providers, show empty state
  if (tableData.broadcasts.length === 0 || tableData.providers.length === 0) {
    return <span className="text-xs text-gray-500 italic">No Broadcasts</span>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            {/* Provider Text */}
            <th className="text-center pr-2 font-medium text-gray-600 border-b border-gray-200">Provider</th>
            {/* Channels */}
            {tableData.broadcasts.map(broadcast => (
              <th 
                key={broadcast} 
                className="text-center px-2 font-medium text-gray-600 border-b border-l border-gray-200 max-w-[10rem] overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {broadcast}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.providers.map(provider => (
            <tr key={provider.providerId}>
                {/* Provider Names */}
              <td className="text-center pr-2 font-normal text-gray-600 border-t border-r border-gray-200 whitespace-nowrap">
                {provider.providerName.split(' - ')[0]}
              </td>
              {/* Channel Numbers */}
              {tableData.broadcasts.map(broadcast => (
                <td 
                  key={`${provider.providerId}-${broadcast}`} 
                  className="text-center border-l border-t border-gray-200"
                >
                  {provider.channels[broadcast] ? (
                    <span className="text-sm">
                      {provider.channels[broadcast]}
                    </span>
                  ) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Broadcasts;