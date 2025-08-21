import { scrapeUrl, combine_maps} from "../helpers.js";
import { ParsedGame, ParsedGames } from "../types.js";

interface SportConfig {
    dateFormat: {
        timeZone: string;
        timeZoneName: string;
    };
    sports: {
        [key: string]: (date: string) => string;
    };
}

interface Team {
    team: {
        id: string;
        displayName: string;
        shortDisplayName: string;
        abbreviation: string;
        logo: string;
    };
    homeAway: "home" | "away";
    records: Array<{
        type: string;
        summary: string;
    }>;
}

interface Broadcast {
    media: {
        shortName: string;
    };
    market: {
        type: string;
    };
    type: {
        shortName: string;
    };
}

interface Notes {
    type: string;
    headline: string;
}

interface Competition {
    competitors: Team[];
    geoBroadcasts: Broadcast[];
    notes: Notes[];
    timeValid: boolean;
}

interface Link {
    text: string;
    href: string;
}

interface Event {
    id: string;
    season: Record<any, any>;
    date: string;
    competitions: Competition[];
    links: Link[];
}

interface ScheduleResponse {
    events: Event[];
    leagues: any;
}

interface TeamData {
    id: string;
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    record: string;
}

const CONFIG: SportConfig = {
  dateFormat: {
    timeZone: "America/New_York",
    timeZoneName: "short",
  },
  sports: {
    nba: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`,
    ncaambb: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=1000&groups=50&dates=${date}`,
    mlb: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${date}`,
    nhl: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${date}`,
    nfl: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${date}`,
    ncaaf: (date: string) =>
      `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${date}`,
  },
};

/**
 * Extracts game details from event data
 * @param events - Event data from ESPN config
 * @returns Formatted game information
 */
function parseEvents(events: ScheduleResponse, sport: string): ParsedGames {
  return combine_maps(events.events.map((event) => {
    const teamData = combine_maps<Record<string, TeamData>>(
      event.competitions[0].competitors.map((team) => ({
        [team.homeAway]: {
          id: team.team.id,
          name: team.team.displayName,
          shortName: team.team.shortDisplayName,
          abbreviation: team.team.abbreviation,
          logo: team.team.logo?.split(".com/").at(-1) as string,
          record: team.records?.find((record) => record.type === "total")?.summary || "",
          metrics: {},
        },
      })),
    );

    const eventData: ParsedGame = {
      sport: sport,
      home: teamData.home,
      away: teamData.away,
      date: event.competitions[0].timeValid ? event.date : "TBD",
      link: event.links?.find((link) => link.text === "Gamecast")?.href || "",
      season: event.season.slug === "regular-season" ? "Regular Season" : events.leagues[0].season.type.name || "",
      broadcasts: combine_maps(
        event.competitions[0].geoBroadcasts.map((broadcast) => ({
          [broadcast.media.shortName]: {
            market: broadcast.market.type,
            type: broadcast.type.shortName,
          },
        })),
      ),
      notes: event.competitions[0].notes,
    };

    return {[event.id]: eventData};
  }));
}

export async function updateScheduleInFirestore(date: string, sport: string): Promise<ParsedGames> {
  try {
    const rawSchedule = JSON.parse(await scrapeUrl(CONFIG.sports[sport](date))) as ScheduleResponse;
    const parsedSchedule = parseEvents(rawSchedule, sport);
    return parsedSchedule;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
