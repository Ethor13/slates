import { logger } from "firebase-functions";
import fetch from "node-fetch";

interface Config {
    espnConfigRegex: RegExp;
    dateOptions: Intl.DateTimeFormatOptions;
}

const CONFIG: Config = {
    espnConfigRegex: /window\['__espnfitt__'\]\s*=\s*({[\s\S]*?});/,
    dateOptions: {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    },
};

/**
 * Scrapes ESPN configuration data from URL
 * @param {string} url - URL to scrape
 * @returns {Promise<Object>} Parsed ESPN configuration data
 * @throws {Error} If scraping or parsing fails
 */
async function scrapeUrl(url: string): Promise<Record<string, any>> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.text();
        return JSON.parse(json);
    } catch (error) {
        throw new Error(`Scraping URL failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Gets today's date in YYYYMMDD format for ESPN URLs
 * @returns {string} Date string in YYYYMMDD format
 */
function getTodayString(offset: number = 0): string {
    const today = new Date();
    today.setDate(today.getDate() + offset);
    const [month, day, year] = new Intl.DateTimeFormat("en-US", CONFIG.dateOptions)
        .format(today)
        .split("/");
    return `${year}${month}${day}`;
}

function mappify<K extends string | number | symbol, V>(keys: K[], values: V[]): Record<K, V> {
    return Object.fromEntries(keys.map((key, index) => [key, values[index]])) as Record<K, V>;
}

function combine_maps<T extends Record<string, unknown>>(maps: T[]): T {
    return Object.assign({}, ...(maps || []));
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const merged = { ...target };

    for (const key in source) {
        const sourceValue = source[key];
        if (sourceValue !== null && typeof sourceValue === 'object' && key in target) {
            Object.assign(merged, { [key]: deepMerge(target[key], sourceValue) });
        } else {
            Object.assign(merged, { [key]: sourceValue });
        }
    }

    return merged as T;
}

const formatGameTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

/**
 * Check if data needs to be updated based on last update time
 * @param metricsLastUpdated - Date of last update
 * @param hours - Number of hours to wait between updates
 * @returns Boolean indicating if update is needed
 */
function needsUpdate(metricsLastUpdated: Date, hours: number): boolean {
    const updateFreq = hours * 60 * 60 * 1000;
    const updateThreshold = new Date(Date.now() - updateFreq);
    return metricsLastUpdated < updateThreshold;
}

export { scrapeUrl, getTodayString, mappify, combine_maps, deepMerge, needsUpdate, formatGameTime };
