import { Firestore, WriteBatch } from "firebase-admin/firestore";
import { combine_maps, deepMerge } from "../helpers";
import { logger } from "firebase-functions";

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
  getGameMetricsFunc: (date: string, sport: string, db: FirebaseFirestore.Firestore) => Promise<Record<string, any>>;
  getInterestScoreFunc: (game: any, sport: string) => number;
}

interface ConfigType {
  categories: Record<string, CategoryConfig>;
  sports: Record<string, string>;
}

interface PowerIndex {
  bpi?: {
    bpi: number;
  };
  [key: string]: any;
}

interface MatchupQualities {
  matchupquality?: number;
  teampredwinpct?: number;
  teampredmov?: number;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  record?: string;
  powerIndexes?: PowerIndex;
  matchupQualities?: MatchupQualities;
  [key: string]: any;
}

interface GameInfo {
  home: Team;
  away: Team;
  [key: string]: any;
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
                },
                spread: 50,
            },
            getGameMetricsFunc: getGameMetricsAllData,
            getInterestScoreFunc: calculateInterestScoreAllData,
        },
    },
    sports: {
        nba: "allData",
        ncaambb: "allData",
    },
};

/**
 * Calculates win percentage from W-L record
 * @param {string} record - Format: "W-L"
 * @returns {number} Win percentage
 */
function calculateWinPercentage(record: string): number {
    const [wins, losses] = record.split("-").map(Number);
    return wins / (wins + losses);
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
function calculateInterestScoreAllData(game: GameInfo, sport: string): number {
    const config = CONFIG.categories.allData;
    const { home, away } = game;

    const homeMQ = home.matchupQualities || {};
    const homePI = home.powerIndexes || {};
    const awayMQ = away.matchupQualities || {};
    const awayPI = away.powerIndexes || {};

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
    if (home.record != null && away.record != null) {
        const homeWinRate = calculateWinPercentage(home.record);
        const awayWinRate = calculateWinPercentage(away.record);
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
}

/**
 * Gets Schedule data for a date, fetching if necessary
 * @param {string} date - Date in format YYYYMMDD
 * @param {string} sport - Sport abbreviation
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<Record<string, any>>} Schedule data
 */
async function getScheduleData(date: string, sport: string, db: FirebaseFirestore.Firestore): Promise<Record<string, any>> {
    // Check if data exists in Firestore
    const scheduleRef = db.collection("schedule").doc(date).collection("sports").doc(sport).collection("games");
    const snapshot = await scheduleRef.get();
    return combine_maps(snapshot.empty ? [] : snapshot.docs.map(doc => ({ [doc.id]: doc.data() })));
}

/**
 * Gets Game Metrics data for a date, fetching if necessary
 * @param {string} date - Date in format YYYYMMDD
 * @param {string} sport - Sport abbreviation
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<Record<string, any>>} Game metrics data
 */
async function getGameMetricsAllData(date: string, sport: string, db: FirebaseFirestore.Firestore): Promise<Record<string, any>> {
    // Check if data exists in Firestore
    const sportRef = db.collection("schedule").doc(date).collection("sports").doc(sport);
    const powerIndexRef = sportRef.collection("teams");
    const matchupQualityRef = sportRef.collection("games");
    
    const powerIndexSnapshot = await powerIndexRef.get();
    const matchupQualitySnapshot = await matchupQualityRef.get();

    if (matchupQualitySnapshot.empty) {
        // If not in Firestore, throw error
        return {};
    }
    
    if (powerIndexSnapshot.empty) {
        // If not in Firestore, throw error
        throw new Error(`No team data found for ${sport} on ${date}`);
    }
    
    const powerIndexData = combine_maps(powerIndexSnapshot.docs.map(doc => ({ [doc.id]: doc.data() })));
    const matchupQualityData = combine_maps(matchupQualitySnapshot.docs.map(doc => ({ [doc.id]: doc.data() })));

    return Object.fromEntries(
        Object.entries(matchupQualityData).map(([gameId, matchupQuality]) => [
            gameId,
            {
                ...matchupQuality,
                home: { 
                    ...(powerIndexData[matchupQuality.home.id] || {}),
                    ...matchupQuality.home 
                },
                away: { 
                    ...(powerIndexData[matchupQuality.away.id] || {}), 
                    ...matchupQuality.away 
                },
            },
        ])
    );
}

/**
 * Scores all games for a given date and sport
 * @param {Firestore} db - Firestore instance
 * @param {WriteBatch} batch - Firestore batch instance
 * @param {string} date - Date in format YYYYMMDD
 * @param {string} sport - Sport abbreviation
 * @returns {Promise<Record<string, any>>} Scored games
 */
export async function scoreSportsGames(db: Firestore, batch: WriteBatch, date: string, sport: string): Promise<void> {
    try {
        const sport_config = CONFIG.categories[CONFIG.sports[sport]];
        const schedule = await getScheduleData(date, sport, db);
        const gameMetrics = await sport_config.getGameMetricsFunc(date, sport, db);

        const games = deepMerge(schedule, gameMetrics);
        const gamesRef = db.collection("schedule").doc(date).collection("sports").doc(sport).collection("games");

        Object.entries(games).forEach(([gameId, game]) => {
            const slateScore = sport_config.getInterestScoreFunc(game, sport);
            batch.set(gamesRef.doc(gameId), { slateScore: slateScore || -1 }, { merge: true });
        });
    } catch (error) {
        logger.error("Error scoring games:", error);
        throw new Error("Error scoring games");
    }
}
