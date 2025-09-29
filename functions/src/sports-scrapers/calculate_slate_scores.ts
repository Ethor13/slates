import { logger } from "firebase-functions";
import { GameScores, ParsedGames, ParsedTeams, TeamMetric } from "../types.js";
import { ParsedGame, GameTeams } from "../types.js";
import teamPopularityData from "../data/team_popularity.json" with { type: "json" };
import conferenceData from "../data/conferences.json" with { type: "json" };

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

interface ConferenceStrengthData {
  [sport: string]: {
    [conference: string]: number;
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
  conference: number;
  rank: number;
}

interface CategoryConfig {
  weights: Weights;
  scalingFactors: ScalingFactors;
  baselines: Record<string, number[]>;
  getInterestScoreFunc: (game: ParsedGame, gameTeams: GameTeams) => Record<string, any>;
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
        conference: 1,
        rank: 1,
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
        nba: [0.5, 0.75, 0.95],
        mlb: [0.3, 0.65, 0.90],
        ncaambb: [0.1, 0.50, 0.90],
        nhl: [0.3, 0.5, 0.90],
        nfl: [0.6, 0.80, 1],
        ncaaf: [0.1, 0.50, 1],
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
function calculateWinPercentage(record: string, pseudo: number = 2): number {
  try {
    const [wins, losses] = record.split("-").map(Number);
    return wins + losses + pseudo > 0 ? (wins + pseudo) / (wins + losses + 2 * pseudo) : 0.5;
  } catch (error) {
    logger.error("Error calculating win percentage from record:", error);
    throw new Error("Invalid record format");
  }
}

const teamPopularityMap = teamPopularityData as TeamPopularityData;

// Normalize conference strengths (per sport) to 0-1 range
const conferenceStrengthRaw = conferenceData as ConferenceStrengthData;
const normalizedConferenceStrength: ConferenceStrengthData = {};
for (const [sport, confMap] of Object.entries(conferenceStrengthRaw)) {
  const values = Object.values(confMap).filter(v => typeof v === "number");
  if (values.length === 0) continue;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  normalizedConferenceStrength[sport] = {} as Record<string, number>;
  for (const [conf, val] of Object.entries(confMap)) {
    if (range === 0) {
      normalizedConferenceStrength[sport][conf] = 0.5; // fallback if all equal
    } else {
      normalizedConferenceStrength[sport][conf] = (val - min) / range;
    }
  }
}

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

function baselineSlateScore(rawScore: number, low: number, baseline: number, high: number): number {
  if (rawScore < baseline) {
    return (rawScore / baseline) * (baseline - low) + low;
  } else {
    return ((rawScore - baseline) / (1 - baseline)) * (high - baseline) + baseline;
  }
}

/**
 * Calculates game interest score
 * @param {GameInfo} game - Game information
 * @param {string} sport - Sport abbreviation
 * @returns {number} Interest score between 0 and 1
 */
function calculateInterestScoreAllData(game: ParsedGame, gameTeams: GameTeams): Record<string, any> {
  try {
    const config = CONFIG.categories.allData;

    const { sport, season } = game;
    const { record: homeRecord, rank: homeRank } = game.home;
    const { record: awayRecord, rank: awayRank } = game.away;
    const { matchupQualities: homeMQ = {} } = game.home.metrics;
    const { matchupQualities: awayMQ = {} } = game.away.metrics;
    const { conference: homeConf = "" as any as TeamMetric } = gameTeams.home || {};
    const { conference: awayConf = "" as any as TeamMetric } = gameTeams.away || {};
    const { powerIndexes: homePI = {} } = gameTeams.home?.metrics || {};
    const { powerIndexes: awayPI = {} } = gameTeams.away?.metrics || {};

    const sportPopularityMap = teamPopularityMap[sport];
    const homePopularity = sportPopularityMap?.[game.home.id];
    const awayPopularity = sportPopularityMap?.[game.away.id];

    let [baselineLow, baseline, baselineHigh] = config.baselines[sport];
    baselineLow = season === "preseason" ? 0 : season === "post-season" ? baseline : baselineLow;
    baselineHigh = season === "preseason" ? baseline : season === "post-season" ? 1 : baselineHigh;
    baseline = season === "preseason" ? baseline / 2 : season === "post-season" ? (baseline + 1) / 2 : baseline;
    const weightStrength = season === "preseason" ? 0.2 : 1;

    const components: Record<string, Record<string, number>> = {};
    let rawSlateScore = inverseSigmoid(baseline, 1, 0);

    // Matchup quality component
    if (homeMQ.matchupquality != null) {
      const mq = (homeMQ.matchupquality - 50) / 50;
      rawSlateScore += mq * config.weights.matchupQuality * weightStrength;
      components.matchupQuality = { value: mq, weight: config.weights.matchupQuality * weightStrength };
    }

    // Win probability component
    if (homeMQ.teampredwinpct != null && awayMQ.teampredwinpct != null) {
      const probabilityDelta = Math.abs(homeMQ.teampredwinpct - awayMQ.teampredwinpct);
      const scaledProbabilityDelta = (1 - probabilityDelta / 50) / 2;
      rawSlateScore += scaledProbabilityDelta * config.weights.winProbability * weightStrength;
      components.winProbability = { value: scaledProbabilityDelta, weight: config.weights.winProbability * weightStrength };
    }

    // Record component
    if (homeRecord != null && awayRecord != null) {
      const homeWinRate = calculateWinPercentage(homeRecord);
      const awayWinRate = calculateWinPercentage(awayRecord);
      const averageWinRate = homeWinRate + awayWinRate - 1;
      rawSlateScore += averageWinRate * config.weights.record * weightStrength;
      components.record = { value: averageWinRate, weight: config.weights.record * weightStrength };
    }

    // Power Index component
    const homePIValue = homePI.bpi?.bpi || homePI.RPI || homePI.fpi || homePI.avg_overall_prediction;
    const awayPIValue = awayPI.bpi?.bpi || awayPI.RPI || awayPI.fpi || awayPI.avg_overall_prediction;
    if (homePIValue != null && awayPIValue != null) {
      const homePowerIndex = sigmoid(homePIValue, config.scalingFactors.powerIndex[sport][0], config.scalingFactors.powerIndex[sport][1]);
      const awayPowerIndex = sigmoid(awayPIValue, config.scalingFactors.powerIndex[sport][0], config.scalingFactors.powerIndex[sport][1]);
      const averagePowerIndex = homePowerIndex + awayPowerIndex - 1;
      rawSlateScore += averagePowerIndex * config.weights.powerIndex * weightStrength;
      components.powerIndex = { value: averagePowerIndex, weight: config.weights.powerIndex * weightStrength };
    }

    // Spread component
    if (homeMQ.teampredmov != null) {
      const spreadScore = neg_exp(homeMQ.teampredmov, config.scalingFactors.spread);
      const scaledSpreadScore = 2 * spreadScore - 1;
      rawSlateScore += scaledSpreadScore * config.weights.spread * weightStrength;
      components.spread = { value: scaledSpreadScore, weight: config.weights.spread * weightStrength };
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
      rawSlateScore += averagePopularity * config.weights.popularity * weightStrength;
      components.popularity = { value: averagePopularity, weight: config.weights.popularity * weightStrength };
    }

    // NCAA Conference Component
    if ((sport as string).startsWith("ncaa")) {
      // change ND conference to ACC
      const homeConfAdj = (game.home?.shortName as any as string) === "Notre Dame" ? "ACC" : homeConf;
      const awayConfAdj = (game.away?.shortName as any as string) === "Notre Dame" ? "ACC" : awayConf;

      const sportConferenceStrengths = normalizedConferenceStrength[sport] || {};
      const homeStrength = sportConferenceStrengths[homeConfAdj as any as string] || 0;
      const awayStrength = sportConferenceStrengths[awayConfAdj as any as string] || 0;

      const conferenceScore = homeStrength + awayStrength - 1;
      rawSlateScore += conferenceScore * config.weights.conference * weightStrength;
      components.conference = { value: conferenceScore, weight: config.weights.conference * weightStrength };

      const homeRankAdj = (homeRank && homeRank <= 25) ? (26 - homeRank) / 25 : 0;
      const awayRankAdj = (awayRank && awayRank <= 25) ? (26 - awayRank) / 25 : 0;
      const rankScore = homeRankAdj + awayRankAdj - 1;
      rawSlateScore += rankScore * config.weights.rank * weightStrength;
      components.rank = { value: rankScore, weight: config.weights.rank * weightStrength };
    }

    const unbaselinedSlateScore = sigmoid(rawSlateScore, 1, 0);
    const slateScore = baselineSlateScore(unbaselinedSlateScore, baselineLow, baseline, baselineHigh);

    return {
      components,
      unbaselinedSlateScore,
      slateScore
    };
  } catch (error) {
    logger.error("Error calculating interest score:", error);
    logger.info(game);
    logger.info(gameTeams);
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
      const scoreDetails = sport_config.getInterestScoreFunc(game, gameTeams);
      res[gameId] = {
        slateScore: scoreDetails.slateScore || -1,
        scoreComponents: scoreDetails.components,
        unbaselinedSlateScore: scoreDetails.unbaselinedSlateScore || -1
      };
    });

    return res;
  } catch (error) {
    logger.error("Error scoring games:", error);
    throw new Error("Error scoring games");
  }
}
