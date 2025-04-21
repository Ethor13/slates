import { combine_maps, mappify, scrapeUrl } from "../helpers.js";
import { logger } from "firebase-functions";
import { GamesMetric, Metrics, ParsedTeams, GameMetric, GamesMetrics, Metric, TeamMetric } from "../types.js";
import * as cheerio from 'cheerio';

interface MetricConfig {
  [metricUrl: string]: (date: string | null) => string;
}

interface ParserConfig {
  team: MetricConfig;
  game: MetricConfig;
  parsers: {
    [parser: string]: (data: any) => Metric;
  };
}

interface SportConfig {
  sports: {
    [sport: string]: ParserConfig
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
    homeAway: "home" | "away";
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

const CONFIG: SportConfig = {
  sports: {
    nba: {
      team: {
        powerIndex: (_date: string | null) => "https://site.web.api.espn.com/apis/fitt/v3/sports/basketball/nba/powerindex?limit=1000",
      },
      game: {
        matchupQuality: (date: string | null) => `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/dailypowerindex?limit=1000&dates=${date}`,
      },
      parsers: {
        powerIndex: parseBasketballPowerIndex,
        matchupQuality: parseMatchupQuality,
      },
    },
    ncaambb: {
      team: {
        powerIndex: (_date: string | null) => "https://site.web.api.espn.com/apis/fitt/v3/sports/basketball/mens-college-basketball/powerindex?limit=1000",
      },
      game: {
        matchupQuality: (date: string | null) => `https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/dailypowerindex?limit=1000&groups=50&dates=${date}`,
      },
      parsers: {
        powerIndex: parseBasketballPowerIndex,
        matchupQuality: parseMatchupQuality,
      },
    },
    mlb: {
      team: {
        powerIndex: (_date: string | null) => "https://www.espn.com/mlb/stats/rpi",
      },
      game: {},
      parsers: {
        powerIndex: parseMLBPowerIndex,
      },
    },
    nhl: {
      team: {},
      game: {},
      parsers: {},
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
function parseBasketballPowerIndex(rawPIData: string): TeamMetric {
  const PIData = JSON.parse(rawPIData) as PowerIndexResponse;

  return combine_maps(PIData.teams.map((team) => {
    const teamData: TeamMetric = {
      info: {
        name: team.team.displayName,
        shortName: team.team.shortDisplayName,
        abbreviation: team.team.abbreviation,
        divisionName: team.team.group.shortName,
        conferenceName: team.team.group.parent.shortName,
        logo: team.team.logos[0].href?.split(".com/").at(-1) as string,
      },
      metrics: {
        powerIndexes: combine_maps(
          team.categories.map((statCategory) => ({
            [statCategory.name]: mappify(
              PIData.categories?.find((category) => category.name === statCategory.name)!.names,
              statCategory.values,
            ),
          })),
        ),
      },
    };

    return { [team.team.id]: teamData };
  }));
}

function parseMLBPowerIndex(rawHtml: string): TeamMetric {
  const $ = cheerio.load(rawHtml);

  // Select the table by id, then first child div, then first child div again
  const table = $('#my-teams-table > div:first-child > div:first-child > table > tbody');

  const trs = table.find('tr');

  // get column names
  const colNames = $(trs[1]).find('td').map((_, column) => {
    return $(column).text();
  }).get();

  return combine_maps(trs.map((_, row) => {
    // skip the first two rows
    if ($(row).index() < 2) return;

    // extract the text in each of the td elements and build a list
    const values = $(row).find('td').map((_, column) => {
      return $(column).text();
    }).get();

    const teamUrl = $($(row).find('td')[1]).find('a').attr('href') as string;
    const teamAbbreviation = teamUrl.split('/')[7];

    const teamId = 0;

    const teamData: TeamMetric = {
      [teamId]: {
        metrics: {
          powerIndexes: mappify(colNames.slice(2), values.slice(2)),
        },
      },
    };

    return teamData;
  }).get());
}

/**
 * Parse matchup quality data from ESPN API response
 * @param MQData - ESPN API matchup quality response
 * @returns Array of parsed matchup quality data
 */
function parseMatchupQuality(MQData: MatchupQualityResponse): GamesMetric {
  return combine_maps(MQData.events?.map((event) => {
    const matchupQualities: GamesMetric = combine_maps(
      event.competitions[0].powerIndexes?.map((teamPowerIndexes) => ({
        [teamPowerIndexes.id]: combine_maps(
          teamPowerIndexes.stats.map((stat) => ({
            [CONFIG.statNameMapper[stat.name]]: stat.value,
          })),
        ),
      })) || [],
    );

    const gameData = combine_maps<GameMetric>(
      event.competitions[0].competitors.map((team) => ({
        [team.homeAway]: {
          matchupQualities: matchupQualities?.[team.team.id],
        },
      })),
    );

    return { [event.id]: gameData };
  }) || [{}]);
}

async function updateMetrics(config: MetricConfig, sport: string, date: string | null): Promise<Metrics> {
  try {
    const allParsedMetrics: Metrics = {};
    for (const [metricName, getMetricUrl] of Object.entries(config)) {
      const rawMetrics = await scrapeUrl(getMetricUrl(date));
      const parsedMetrics = CONFIG.sports[sport].parsers[metricName](rawMetrics);
      allParsedMetrics[metricName] = parsedMetrics;
    }

    return allParsedMetrics;
  } catch (error) {
    logger.error("Error updating metrics:", error);
    throw new Error(`Error updating metrics: ${error}`);
  }
}

/**
 * Scrape and update game metrics in Firestore
 * @param date - Date string in YYYYMMDD format
 * @param sport - Sport identifier
 */
export async function updateGameMetrics(date: string, sport: string): Promise<GamesMetrics> {
  try {
    const sport_game_config = CONFIG.sports[sport].game;
    return await updateMetrics(sport_game_config, sport, date);
  } catch (error) {
    logger.error("Error updating game metrics:", error);
    throw new Error(`Error updating game metrics: ${error}`);
  }
}

export async function updateTeamMetrics(sport: string): Promise<ParsedTeams> {
  try {
    const sport_team_config = CONFIG.sports[sport].team;
    const teamMetrics = await updateMetrics(sport_team_config, sport, null);

    const res: ParsedTeams = {};
    Object.entries(teamMetrics).forEach(([_, teams]) => {
      Object.entries(teams).forEach(([teamId, teamMetric]) => {
        if (!res[teamId]) {
          res[teamId] = { info: {}, metrics: {} };
        }
        res[teamId].info = { ...res[teamId].info, ...teamMetric.info };
        res[teamId].metrics = { ...res[teamId].metrics, ...teamMetric.metrics };
      });
    });

    return res;
  } catch (error) {
    logger.error("Error updating team metrics:", error);
    throw new Error(`Error updating team metrics: ${error}`);
  }
}