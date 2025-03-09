import { Firestore, WriteBatch } from "firebase-admin/firestore";
import { scrapeUrl, combine_maps} from "../helpers.js";

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

interface GameData {
    home: TeamData;
    away: TeamData;
    date: string;
    link: string;
    broadcasts: {
        [key: string]: {
            market: string;
            type: string;
        };
    };
    notes: Notes[];
}

interface ParsedGame {
    id: string;
    data: GameData;
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
      // eslint-disable-next-line max-len
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=1000&groups=50&dates=${date}`,
  },
};

/**
 * Extracts game details from event data
 * @param events - Event data from ESPN config
 * @returns Formatted game information
 */
function parseEvents(events: ScheduleResponse): ParsedGame[] {
  return events.events.map((event) => {
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

    const eventData: GameData = {
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

    return { id: event.id, data: eventData };
  });
}

export async function updateScheduleInFirestore(
  db: Firestore, batch: WriteBatch, date: string, sport: string
): Promise<void> {
  try {
    const rawSchedule = (await scrapeUrl(CONFIG.sports[sport](date))) as ScheduleResponse;
    const parsedSchedule = parseEvents(rawSchedule);

    const gamesRef = db.collection("schedule").doc(date).collection("sports").doc(sport).collection("games");

    // Create a temp document to force Firestore to commit the batch
    const tempDocRef = gamesRef.doc("temp");
    batch.set(tempDocRef, {}); // Add an empty document
    batch.delete(tempDocRef);  // Immediately delete it

    for (const game of parsedSchedule) {
      batch.set(gamesRef.doc(game.id), game.data, { merge: true });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
