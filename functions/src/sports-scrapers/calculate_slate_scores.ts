import { logger } from "firebase-functions";
import { GameScores, ParsedGames, ParsedTeams } from "../types.js";
import { ParsedGame, GameTeams } from "../types.js";

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
      },
      scalingFactors: {
        powerIndex: {
          nba: [2, 0],
          ncaambb: [8, 0],
          mlb: [0.15, 0.5],
          nhl: [0.05, 0.5],
        },
        spread: 50,
      },
      baselines: {
        nba: 0.75,
        ncaambb: 0.60,
        mlb: 0.50,
        nhl: 0.50,
      },
      getInterestScoreFunc: calculateInterestScoreAllData,
    },
  },
  sports: {
    nba: "allData",
    ncaambb: "allData",
    mlb: "allData",
    nhl: "allData",
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
    return wins / (wins + losses);
  } catch (error) {
    logger.error("Error calculating win percentage from record:", error);
    throw new Error("Invalid record format");
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

    const { sport } = game;
    const { record: homeRecord } = game.home;
    const { record: awayRecord } = game.away;
    const { matchupQualities: homeMQ = {} } = game.home.metrics;
    const { matchupQualities: awayMQ = {} } = game.away.metrics;
    const { powerIndexes: homePI = {} } = gameTeams.home?.metrics || {};
    const { powerIndexes: awayPI = {} } = gameTeams.away?.metrics || {};

    let rawSlateScore = inverseSigmoid(config.baselines[sport], 1, 0);

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
    const homePIValue = homePI.bpi?.bpi || homePI.RPI || homePI.avg_overall_prediction;
    const awayPIValue = awayPI.bpi?.bpi || awayPI.RPI || awayPI.avg_overall_prediction;
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
