import { combine_maps } from "../helpers.js";
import axios from "axios";

// const zipcode = "91362";
const SERVICE_PROVIDER_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/{}/web";
const CHANNELS_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/{}/sources/web";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"

export const getProviders = async (zipcode: string) => {
  const url = SERVICE_PROVIDER_URL.replace("{}", zipcode);

  const response = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Error fetching service providers: ${response.statusText}`);
  }

  const providers = combine_maps(response.data.data.items.map((provider: any) => ({
    [provider.id]: {
      name: provider.name,
      type: provider.type,
    }
  })));

  return providers;
}

export const getChannels = async (providerId: string) => {
  const url = CHANNELS_URL.replace("{}", providerId);
  const response = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Error fetching channels for provider ${providerId}: ${response.statusText}`);
  }

  const channels = combine_maps(response.data.data.items.map((channel: any) => ({
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
