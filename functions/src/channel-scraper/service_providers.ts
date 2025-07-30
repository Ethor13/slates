import { combine_maps } from "../helpers.js";

// const zipcode = "91362";
const SERVICE_PROVIDER_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/{}/web";
const CHANNELS_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/{}/sources/web";

export const getProviders = async (zipcode: string) => {
  const url = SERVICE_PROVIDER_URL.replace("{}", zipcode);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching service providers: ${response.statusText}`);
  }

  const data = await response.json();
  const providers = combine_maps(data.data.items.map((provider: any) => ({
    [provider.id]: {
      name: provider.name,
      type: provider.type,
    }
  })));

  return providers;
}

export const getChannels = async (providerId: string) => {
  const url = CHANNELS_URL.replace("{}", providerId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching channels for provider ${providerId}: ${response.statusText}`);
  }

  const data = await response.json();
  const channels = combine_maps(data.data.items.map((channel: any) => ({
    [channel.sourceId]: {
      names: {
        name: channel.name,
        fullName: channel.fullName,
        networkName: channel.networkName
      },
      number: channel.number,
      logo: channel.logo,
    }
  })));

  return channels;
}
