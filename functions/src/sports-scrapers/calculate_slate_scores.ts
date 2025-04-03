import { logger } from "firebase-functions";
import { GameScores, ParsedGames, ParsedTeams } from "../types.js";
import { ParsedGame, GameTeams } from "../types.js";

// Define TypeScript interfaces
interface ScalingFactors {
  powerIndex: Record<string, number>;
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
        matchupQuality: 3,
        winProbability: 1,
        record: 5,
        powerIndex: 2,
        spread: 0.5,
      },
      scalingFactors: {
        powerIndex: {
          nba: 3,
          ncaambb: 8,
          mlb: 0,
        },
        spread: 50,
      },
      getInterestScoreFunc: calculateInterestScoreAllData,
    },
  },
  sports: {
    nba: "allData",
    ncaambb: "allData",
    mlb: "allData",
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
function sigmoid(x: number, scale: number): number {
  return 1 / (1 + Math.exp(-x / scale));
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

    const components: number[] = [];
    const weights: number[] = [];

    // Matchup quality component
    if (homeMQ.matchupquality != null) {
      components.push((homeMQ.matchupquality / 100) * config.weights.matchupQuality);
      weights.push(config.weights.matchupQuality);
    }

    // Win probability component
    if (homeMQ.teampredwinpct != null && awayMQ.teampredwinpct != null) {
      const probabilityDelta = Math.abs(homeMQ.teampredwinpct - awayMQ.teampredwinpct);
      components.push((1 - probabilityDelta / 100) * config.weights.winProbability);
      weights.push(config.weights.winProbability);
    }

    // Record component
    if (homeRecord != null && awayRecord != null) {
      const homeWinRate = calculateWinPercentage(homeRecord);
      const awayWinRate = calculateWinPercentage(awayRecord);
      const averageWinRate = (homeWinRate + awayWinRate) / 2;
      components.push(averageWinRate * config.weights.record);
      weights.push(config.weights.record);
    }

    // Power Index component
    if (homePI.bpi?.bpi != null && awayPI.bpi?.bpi != null) {
      const homePowerIndex = sigmoid(homePI.bpi.bpi, config.scalingFactors.powerIndex[sport]);
      const awayPowerIndex = sigmoid(awayPI.bpi.bpi, config.scalingFactors.powerIndex[sport]);
      const averagePowerIndex = (homePowerIndex + awayPowerIndex) / 2;
      components.push(averagePowerIndex * config.weights.powerIndex);
      weights.push(config.weights.powerIndex);
    }

    // Spread component
    if (homeMQ.teampredmov != null) {
      const spreadScore = neg_exp(homeMQ.teampredmov, config.scalingFactors.spread);
      components.push(spreadScore * config.weights.spread);
      weights.push(config.weights.spread);
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight === 0) {
      return -1;
    } else {
      const slateScore = components.reduce((a, b) => a + b, 0) / totalWeight;
      return slateScore;
    }
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
