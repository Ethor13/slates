import { Firestore, WriteBatch } from "firebase-admin/firestore";
import { combine_maps, mappify, scrapeUrl } from "../helpers";
import { logger } from "firebase-functions";

interface SportConfig {
    sports: {
        [key: string]: {
            powerIndex: (date: string) => string;
            matchupQuality: (date: string) => string;
        };
    };
    parsers: {
        [key: string]: {
            parser: (arg0: any) => ParsedData<any>[];
            result: "teams" | "games";
        };
    };
    statNameMapper: {
        [key: string]: string;
    };
}

// Power Index interfaces
interface TeamInfo {
    id: string;
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
    logos: Array<{
        href: string;
    }>;
    group: {
        shortName: string;
        parent: {
            shortName: string;
        };
    };
}

interface StatCategory {
    name: string;
    values: number[];
}

interface TeamPowerIndex {
    team: TeamInfo;
    categories: StatCategory[];
}

interface PowerIndexResponse {
    teams: TeamPowerIndex[];
    categories: Array<{
        name: string;
        names: string[];
    }>;
}

// Matchup Quality interfaces
interface TeamMatchupQuality {
    id: string;
    stats: Array<{
        name: string;
        value: number;
    }>;
}

interface Competition {
    competitors: Array<{
        team: TeamInfo;
        homeAway: 'home' | 'away';
    }>;
    powerIndexes?: TeamMatchupQuality[];
    geoBroadcasts: Array<{
        media: {
            shortName: string;
        };
        market: {
            type: string;
        };
        type: {
            shortName: string;
        };
    }>;
    links: Array<{
        text: string;
        href: string;
    }>;
}

interface Event {
    id: string;
    date: string;
    competitions: Competition[];
}

interface MatchupQualityResponse {
    events: Event[];
}

// Parsed data interfaces
interface TeamData {
    name: string;
    shortName: string;
    abbreviation: string;
    divisionName: string;
    conferenceName: string;
    logo: string;
    powerIndexes?: Record<string, Record<string, number>>;
    matchupQualities?: Record<string, number>;
}

interface GameData {
    home: Partial<TeamData>;
    away: Partial<TeamData>;
    date: string;
    link: string;
    broadcasts: {
        [key: string]: {
            market: string;
            type: string;
        };
    };
}

interface ParsedData<T> {
    id: string;
    data: T;
}

const CONFIG: SportConfig = {
    sports: {
        nba: {
            powerIndex: (date: string) => "https://site.web.api.espn.com/apis/fitt/v3/sports/basketball/nba/powerindex?limit=1000",
            matchupQuality: (date: string) => `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/dailypowerindex?limit=1000&dates=${date}`,
        },
        ncaambb: {
            powerIndex: (date: string) => "https://site.web.api.espn.com/apis/fitt/v3/sports/basketball/mens-college-basketball/powerindex?limit=1000",
            matchupQuality: (date: string) => `https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/dailypowerindex?limit=1000&groups=50&dates=${date}`,
        },
    },
    parsers: {
        powerIndex: {
            parser: parsePowerIndex,
            result: "teams",
        },
        matchupQuality: {
            parser: parseMatchupQuality,
            result: "games",
        },
    },
    statNameMapper: {
        matchupquality: "matchupquality",
        teampredwinpct: "teampredwinpct",
        gameprojection: "teampredwinpct",
        opponentpredwinpct: "teampredlosspct",
        teamchanceloss: "teampredlosspct",
        teampredmov: "teampredmov",
        teampredptdiff: "favoredteampredmov",
        teamexpectedpts: "teamexpectedpts",
        oppexpectedpts: "oppexpectedpts",
    },
};

/**
 * Parse team power index data from ESPN API response
 * @param PIData - ESPN API power index response
 * @returns Array of parsed power index data
 */
function parsePowerIndex(PIData: PowerIndexResponse): ParsedData<TeamData>[] {
    return PIData.teams.map((team) => {
        const teamData: TeamData = {
            name: team.team.displayName,
            shortName: team.team.shortDisplayName,
            abbreviation: team.team.abbreviation,
            divisionName: team.team.group.shortName,
            conferenceName: team.team.group.parent.shortName,
            logo: team.team.logos[0].href,
            powerIndexes: combine_maps(
                team.categories.map((statCategory) => ({
                    [statCategory.name]: mappify(
                        PIData.categories?.find((category) => category.name === statCategory.name)!.names,
                        statCategory.values
                    ),
                }))
            ),
        };

        return { id: team.team.id, data: teamData };
    });
}

/**
 * Parse matchup quality data from ESPN API response
 * @param MQData - ESPN API matchup quality response
 * @returns Array of parsed matchup quality data
 */
function parseMatchupQuality(MQData: MatchupQualityResponse): ParsedData<GameData>[] {
    return MQData.events.map((event) => {
        const matchupQualities = combine_maps(
            event.competitions[0].powerIndexes?.map((teamPowerIndexes) => ({
                [teamPowerIndexes.id]: combine_maps(
                    teamPowerIndexes.stats.map((stat) => ({
                        [CONFIG.statNameMapper[stat.name]]: stat.value,
                    }))
                ),
            })) || []
        );
        
        const TeamData = combine_maps<Record<string, Partial<TeamData>>>(
            event.competitions[0].competitors.map((team) => ({
                [team.homeAway]: {
                    id: team.team.id,
                    name: team.team.displayName,
                    shortName: team.team.shortDisplayName,
                    abbreviation: team.team.abbreviation,
                    logo: team.team.logos?.[0].href,
                    matchupQualities: matchupQualities?.[team.team.id],
                },
            }))
        );

        const gameData: GameData = {
            home: TeamData.home,
            away: TeamData.away,
            date: event.date,
            link: event.competitions[0].links?.find((link) => link.text === "Gamecast")!.href,
            broadcasts: combine_maps(
                event.competitions[0].geoBroadcasts.map((broadcast) => ({
                    [broadcast.media.shortName]: {
                        market: broadcast.market.type,
                        type: broadcast.type.shortName,
                    },
                }))
            ),
        };

        return { id: event.id, data: gameData };
    });
}

/**
 * Scrape and update game metrics in Firestore
 * @param db - Firestore database instance
 * @param date - Date string in YYYYMMDD format
 * @param sport - Sport identifier (nba, ncaambb)
 */
export async function updateGameMetrics(db: Firestore, batch: WriteBatch, date: string, sport: string): Promise<void> {
    try {
        const sport_config = CONFIG.sports[sport];
        const sportRef = db.collection("schedule").doc(date).collection("sports").doc(sport);

        for (const [metricTypeAny, getMetricUrl] of Object.entries(sport_config)) {
            const metricType = metricTypeAny as keyof SportConfig["sports"][string];
            const parser = CONFIG.parsers[metricType].parser;
            const collectionName = CONFIG.parsers[metricType].result;

            // Fetch and parse data
            const rawMetrics = await scrapeUrl(getMetricUrl(date));
            const parsedMetrics = parser(rawMetrics);

            for (const item of parsedMetrics) {
                const itemRef = sportRef.collection(collectionName).doc(item.id);
                batch.set(itemRef, item.data, { merge: true });
            }
        }
    } catch (error) {
        logger.error("Error updating game metrics (INSIDE SCRAPE GAME METRICS):", error);
        throw new Error(`Error updating game metrics: ${error}`);
    }
}