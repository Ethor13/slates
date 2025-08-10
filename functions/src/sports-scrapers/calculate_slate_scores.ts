import { logger } from "firebase-functions";
import { GameScores, ParsedGames, ParsedTeams } from "../types.js";
import { ParsedGame, GameTeams } from "../types.js";
import teamPopularityData from "../data/team_popularity.json" with { type: "json" };

// Define TypeScript interfaces for team popularity data
interface TeamPopularityInfo {
  teamName: string;
  instagramFollowers: number;
  xFollowers: number;
}

interface TeamPopularityData {
  [sport: string]: {
    [teamId: string]: TeamPopularityInfo;
  };
}

// Define TypeScript interfaces
interface ScalingFactors {
  powerIndex: Record<string, any>;
  spread: number;
}

interface Weights {
  matchupQuality: number;
  winProbability: number;
  record: number;
  powerIndex: number;
  spread: number;
  popularity: number;
}

interface CategoryConfig {
  weights: Weights;
  scalingFactors: ScalingFactors;
  baselines: Record<string, number>;
  getInterestScoreFunc: (game: ParsedGame, gameTeams: GameTeams) => number;
}

interface ConfigType {
  categories: Record<string, CategoryConfig>;
  sports: Record<string, string>;
}

const CONFIG: ConfigType = {
  categories: {
    allData: {
      weights: {
        matchupQuality: 2,
        winProbability: 1,
        record: 3,
        powerIndex: 3,
        spread: 1,
        popularity: 1,
      },
      scalingFactors: {
        powerIndex: {
          nba: [2, 0],
          ncaambb: [8, 0],
          mlb: [0.15, 0.5],
          nhl: [0.05, 0.5],
          nfl: [1.5, 0],
          ncaaf: [10, 0]
        },
        spread: 50,
      },
      baselines: {
        nba: 0.75,
        mlb: 0.65,
        ncaambb: 0.50,
        nhl: 0.50,
        nfl: 0.80,
        ncaaf: 0.60,
      },
      getInterestScoreFunc: calculateInterestScoreAllData,
    },
  },
  sports: {
    nba: "allData",
    ncaambb: "allData",
    mlb: "allData",
    nhl: "allData",
    nfl: "allData",
    ncaaf: "allData",
  },
};

/**
 * Calculates win percentage from W-L record
 * @param {string} record - Format: "W-L"
 * @returns {number} Win percentage
 */
function calculateWinPercentage(record: string): number {
  try {
    const [wins, losses] = record.split("-").map(Number);
    return wins + losses > 0 ? wins / (wins + losses) : 0.5;
  } catch (error) {
    logger.error("Error calculating win percentage from record:", error);
    throw new Error("Invalid record format");
  }
}

const teamPopularityMap = teamPopularityData as TeamPopularityData;

// Calculate average popularity for each sport
const medSportsPopularity = new Map<string, number>();
for (const [sport, teamMap] of Object.entries(teamPopularityMap)) {
  const followers = Object.values(teamMap).map(team => team.instagramFollowers + team.xFollowers);
  if (followers.length > 0) {
    const sorted = [...followers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    medSportsPopularity.set(sport, median);
  }
}

/**
 * Normalizes value using sigmoid function
 * @param {number} x - value
 * @param {number} scale - scaling factor
 * @returns {number} Normalized value between 0 and 1
 */
function sigmoid(x: number, scale: number, center: number): number {
  return 1 / (1 + Math.exp(-(x - center) / scale));
}

/**
 * Inverse sigmoid function
 * @param {number} x - value
 * @param {number} scale - scaling factor
 * @param {number} center - center point
 * @returns {number} Inverse sigmoid value
 */
function inverseSigmoid(x: number, scale: number, center: number): number {
  return center + scale * Math.log(x / (1 - x));
}

/**
 * Normalizes value using negative exponential function
 * @param {number} x - value
 * @param {number} scale - scaling factor
 * @returns {number} Normalized value between 0 and 1
 */
function neg_exp(x: number, scale: number): number {
  return Math.exp(-Math.pow(x, 2) / scale);
}

/**
 * Calculates game interest score
 * @param {GameInfo} game - Game information
 * @param {string} sport - Sport abbreviation
 * @returns {number} Interest score between 0 and 1
 */
function calculateInterestScoreAllData(game: ParsedGame, gameTeams: GameTeams): number {
  try {
    const config = CONFIG.categories.allData;

    const { sport, season } = game;
    const { record: homeRecord } = game.home;
    const { record: awayRecord } = game.away;
    const { matchupQualities: homeMQ = {} } = game.home.metrics;
    const { matchupQualities: awayMQ = {} } = game.away.metrics;
    const { powerIndexes: homePI = {} } = gameTeams.home?.metrics || {};
    const { powerIndexes: awayPI = {} } = gameTeams.away?.metrics || {};

    const sportPopularityMap = teamPopularityMap[sport];
    const homePopularity = sportPopularityMap?.[game.home.id];
    const awayPopularity = sportPopularityMap?.[game.away.id];

    const baseline = season === "Preseason" ? config.baselines[sport] / 3 : season === "Postseason" ? (config.baselines[sport] + 1) / 2 : config.baselines[sport];
    let rawSlateScore = inverseSigmoid(baseline, 1, 0);

    // Matchup quality component
    if (homeMQ.matchupquality != null) {
      rawSlateScore += ((homeMQ.matchupquality - 50) / 50) * config.weights.matchupQuality;
    }

    // Win probability component
    if (homeMQ.teampredwinpct != null && awayMQ.teampredwinpct != null) {
      const probabilityDelta = Math.abs(homeMQ.teampredwinpct - awayMQ.teampredwinpct);
      rawSlateScore += ((1 - probabilityDelta / 50) / 2) * config.weights.winProbability;
    }

    // Record component
    if (homeRecord != null && awayRecord != null) {
      const homeWinRate = calculateWinPercentage(homeRecord);
      const awayWinRate = calculateWinPercentage(awayRecord);
      const averageWinRate = homeWinRate + awayWinRate - 1;
      rawSlateScore += averageWinRate * config.weights.record;
    }

    // Power Index component
    const homePIValue = homePI.bpi?.bpi || homePI.RPI || homePI.fpi || homePI.avg_overall_prediction;
    const awayPIValue = awayPI.bpi?.bpi || awayPI.RPI || awayPI.fpi || awayPI.avg_overall_prediction;
    if (homePIValue != null && awayPIValue != null) {
      const homePowerIndex = sigmoid(homePIValue, config.scalingFactors.powerIndex[sport][0], config.scalingFactors.powerIndex[sport][1]);
      const awayPowerIndex = sigmoid(awayPIValue, config.scalingFactors.powerIndex[sport][0], config.scalingFactors.powerIndex[sport][1]);
      const averagePowerIndex = homePowerIndex + awayPowerIndex - 1;
      rawSlateScore += averagePowerIndex * config.weights.powerIndex;
    }

    // Spread component
    if (homeMQ.teampredmov != null) {
      const spreadScore = neg_exp(homeMQ.teampredmov, config.scalingFactors.spread);
      rawSlateScore += (2 * spreadScore - 1) * config.weights.spread;
    }

    // Popularity component
    if (homePopularity != undefined && awayPopularity != undefined) {
      // Calculate total popularity (Instagram + X followers) for each team
      const homePopularityScore = homePopularity.instagramFollowers + homePopularity.xFollowers;
      const awayPopularityScore = awayPopularity.instagramFollowers + awayPopularity.xFollowers;
      
      const medPopularity = medSportsPopularity.get(sport)!;
      const homeNormalizedScore = sigmoid(homePopularityScore, medPopularity / 2, medPopularity);
      const awayNormalizedScore = sigmoid(awayPopularityScore, medPopularity / 2, medPopularity);
      const averagePopularity = homeNormalizedScore + awayNormalizedScore - 1;
      rawSlateScore += averagePopularity * config.weights.popularity;
    }

    return sigmoid(rawSlateScore, 1, 0);
  } catch (error) {
    logger.error("Error calculating interest score:", error);
    throw new Error("Error calculating interest score");
  }
}

/**
 * Scores all games for a given date and sport
 * @param {string} sport - Sport abbreviation
 * @param {ParsedGames} games - Parsed games
 * @param {ParsedTeams} teams - Parsed teams
 * @returns {Promise<Record<string, any>>} Scored games
 */
export async function scoreSportsGames(sport: string, games: ParsedGames, teams: ParsedTeams): Promise<GameScores> {
  try {
    const sport_config = CONFIG.categories[CONFIG.sports[sport]];

    const res: GameScores = {};
    Object.entries(games).forEach(([gameId, game]) => {
      const gameTeams = {
        home: teams[game.home.id],
        away: teams[game.away.id],
      }
      const slateScore = sport_config.getInterestScoreFunc(game, gameTeams) || -1;
      res[gameId] = slateScore;
    });

    return res;
  } catch (error) {
    logger.error("Error scoring games:", error);
    throw new Error("Error scoring games");
  }
}
