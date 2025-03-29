import { combine_maps } from "../helpers.js";
import axios from "axios";

// const zipcode = "91362";
const SERVICE_PROVIDER_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceproviders/zipcode/{}/web";
const CHANNELS_URL = "https://backend.tvguide.com/tvschedules/tvguide/serviceprovider/{}/sources/web";

export const getProviders = async (zipcode: string) => {
  const url = SERVICE_PROVIDER_URL.replace("{}", zipcode);

  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
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
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Error fetching channels for provider ${providerId}: ${response.statusText}`);
  }

  const channels = combine_maps(response.data.data.items.map((channel: any) => ({
    [channel.sourceId]: {
      names: {
        name: channel.name,
        fullName: channel.fullName,
        networkName: channel.networkName,
        commonName: channel.fullName.endsWith(")") ? channel.fullName.split("(")[1].split(")")[0] : channel.fullName,
      },
      number: channel.number,
      logo: channel.logo,
    }
  })));

  return channels;
}
