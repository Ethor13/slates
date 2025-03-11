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
}

interface Link {
    text: string;
    href: string;
}

interface Event {
    id: string;
    date: string;
    competitions: Competition[];
    links: Link[];
}

interface ScheduleResponse {
    events: Event[];
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
          logo: team.team.logo,
          record: team.records?.find((record) => record.type === "total")?.summary || "",
        },
      })),
    );

    const eventData: ParsedGame = {
      sport: sport,
      home: teamData.home,
      away: teamData.away,
      date: event.date,
      link: event.links?.find((link) => link.text === "Gamecast")?.href || "",
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
    const rawSchedule = (await scrapeUrl(CONFIG.sports[sport](date))) as ScheduleResponse;
    const parsedSchedule = parseEvents(rawSchedule, sport);
    return parsedSchedule;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
