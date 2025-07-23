import uszipsCSV from './components/Games/zipcode_coordinates.csv?raw';
import teamCoordinatesCSV from './components/Games/team_coordinates.csv?raw';

export enum Sports {
    NBA = 'nba',
    NCAAMBB = 'ncaambb',
    MLB = 'mlb',
    NHL = 'nhl',
}

// Parse CSV data and create zipcode to lat/lng mapping
const parseZipCodeData = (): Map<string, [number, number]> => {
    const zipMap = new Map<string, [number, number]>();
    const lines = uszipsCSV.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted values)
        const matches = line.match(/^"([^"]+)","([^"]+)","([^"]+)"/);
        if (matches) {
            const [, zip, lat, lng] = matches;
            zipMap.set(zip, [parseFloat(lat), parseFloat(lng)]);
        }
    }
    
    return zipMap;
};

// Create the zipcode mapping
const zipcodeMap = parseZipCodeData();

// Parse team coordinates CSV and create sport -> team_id -> lat/lng mapping
const parseTeamCoordinatesData = (): Map<string, Map<string, [number, number]>> => {
    const teamMap = new Map<string, Map<string, [number, number]>>();
    const lines = teamCoordinatesCSV.split('\n');
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 5) {
            const sport = parts[0];
            const teamId = parts[1];
            const lat = parseFloat(parts[3]);
            const lng = parseFloat(parts[4]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Create sport map if it doesn't exist
                if (!teamMap.has(sport)) {
                    teamMap.set(sport, new Map<string, [number, number]>());
                }
                
                // Add team coordinates to the sport map
                const sportMap = teamMap.get(sport)!;
                sportMap.set(teamId, [lat, lng]);
            }
        }
    }

    return teamMap;
};

// Create the team coordinates mapping
const teamCoordinatesMap = parseTeamCoordinatesData();

export const formatGameTime = (timeString: string): string => {
    if (timeString === "TBD") return "TBD";
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function square(x: number): number {
  return Math.pow(x, 2);
}

/**
 * Distance between two lat/lng coordinates in km using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @param miles - Optional flag to return distance in miles instead of kilometers
 * @returns Distance between coordinates in km (default) or miles
 */
export const getDistanceFromLatLng = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number, 
  miles: boolean = false
): number => {
  const r = 6371; // radius of the earth in km
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  const latDif = lat2Rad - lat1Rad;
  const lngDif = deg2rad(lng2 - lng1);
  const a = square(Math.sin(latDif / 2)) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * square(Math.sin(lngDif / 2));
  const d = 2 * r * Math.asin(Math.sqrt(a));
  
  if (miles) {
    return d * 0.621371; // return miles
  } else {
    return d; // return km
  }
}
/* Copyright 2016, Chris Youderian, SimpleMaps, http://simplemaps.com/resources/location-distance
 Released under MIT license - https://opensource.org/licenses/MIT */

export interface InterestLevel {
    className: string;
    rating: string | JSX.Element;
}

export const getInterestLevel = (game: Record<any, any>, zipcode: string): InterestLevel => {
    const [userLat, userLng] = zipcodeMap.get(zipcode) || [undefined, undefined];

    let score = game.slateScore;

    if (userLat !== undefined && userLng !== undefined) {
        // Get the sport map first
        const sportMap = teamCoordinatesMap.get(game.sport);

        // Get coordinates for both teams using team IDs
        const homeTeamCoords = sportMap?.get(game.home.id.toString()) || [undefined, undefined];
        const awayTeamCoords = sportMap?.get(game.away.id.toString()) || [undefined, undefined];
        
        // Calculate distances to both teams
        let minDistance = Infinity;
        
        if (homeTeamCoords[0] !== undefined && homeTeamCoords[1] !== undefined) {
            const homeDistance = getDistanceFromLatLng(userLat, userLng, homeTeamCoords[0], homeTeamCoords[1], true);
            minDistance = Math.min(minDistance, homeDistance);
        }
        
        if (awayTeamCoords[0] !== undefined && awayTeamCoords[1] !== undefined) {
            const awayDistance = getDistanceFromLatLng(userLat, userLng, awayTeamCoords[0], awayTeamCoords[1], true);
            minDistance = Math.min(minDistance, awayDistance);
        }

        if (minDistance !== Infinity) {
            const maxLocationEffect = 0.7;
            const distanceFactor = 0.002;
            const minLocationScore = Math.max(0, maxLocationEffect - minDistance * distanceFactor);
            score = minLocationScore + (1 - minLocationScore) * score;
        }
    }

    const rating = score >= 0 ? (100 * score).toFixed(0) : "?";
    if (score >= 0.8) return { className: "must-watch", rating };
    if (score >= 0.6) return { className: "high-interest", rating };
    if (score >= 0.4) return { className: "decent", rating };
    if (score >= 0) return { className: "low-interest", rating };
    return { className: "unknown-interest", rating };
};

export const getDateString = (date: Date): string => {
  return date.toLocaleDateString("en-CA").slice(0, 10);
};

export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};
