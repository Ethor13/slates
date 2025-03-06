import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { scrapeGameMetrics } from "./scrape_game_metrics.js";
import { scrapeSchedule } from "./scrape_schedule.js";
import { combine_maps, deepMerge, getTodayString } from "./helpers.js";
import { calculateGameMetrics } from "./calculate_game_metrics.js";

const CONFIG = {
    paths: {
        powerIndexDir: "c:/Users/ethor/python-docs/sports-guide/data/power-index",
        matchupQualityDir: "c:/Users/ethor/python-docs/sports-guide/data/matchup-quality",
        gamesDir: "c:/Users/ethor/python-docs/sports-guide/data/games",
    },
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
function calculateWinPercentage(record) {
    const [wins, losses] = record.split("-").map(Number);
    return wins / (wins + losses);
}

/**
 * Normalizes value using sigmoid function
 * @param {number} x - value
 * @returns {number} Normalized value between 0 and 1
 */
function sigmoid(x, scale) {
    return 1 / (1 + Math.exp(-x / scale));
}

/**
 * Normalizes value using sigmoid function
 * @param {number} x - value
 * @returns {number} Normalized value between 0 and 1
 */
function neg_exp(x, scale) {
    return Math.exp(-Math.pow(x, 2) / scale);
}

/**
 * Calculates game interest score
 * @param {GameInfo} game - Game information
 * @returns {number} Interest score between 0 and 1
 */
function calculateInterestScorePartial(game) {
    const { home, away } = game;

    // Win probability component
    const probabilityDelta = Math.abs(home.probability - away.probability);
    const probabilityScore = 1 - probabilityDelta / 100;

    // Team record component
    const homeWinRate = calculateWinPercentage(home.record);
    const awayWinRate = calculateWinPercentage(away.record);
    const averageWinRate = (homeWinRate + awayWinRate) / 2;

    // Power Index component
    const homeScaledPI = sigmoid(home.powerIndex, CONFIG.scalingFactors.powerIndex);
    const awayScaledPI = sigmoid(away.powerIndex, CONFIG.scalingFactors.powerIndex);
    const averagePowerIndex = (homeScaledPI + awayScaledPI) / 2;

    return (
        probabilityScore * CONFIG.weights.winProbability +
        averageWinRate * CONFIG.weights.record +
        averagePowerIndex * CONFIG.weights.powerIndex
    );
}

/**
 * Calculates game interest score
 * @param {GameInfo} game - Game information
 * @param {string} sport - Sport abbreviation
 * @returns {number} Interest score between 0 and 1
 */
function calculateInterestScoreAllData(game, sport) {
    const config = CONFIG.categories.allData;
    const { home, away } = game;

    const homeMQ = home.matchupQualities;
    const homePI = home.powerIndexes;
    const awayMQ = away.matchupQualities;
    const awayPI = away.powerIndexes;

    const components = [];
    const weights = [];

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
 * Gets Schedule data for today, fetching if necessary
 * @param {string} date - Date in format MM/DD/YYYY
 * @param {string} sport - Sport abbreviation
 * @returns {Promise<Object>} Schedule data
 */
async function getScheduleData(date, sport) {
    await scrapeSchedule(date, sport);
    const gamesPath = join(CONFIG.paths.gamesDir, sport, `${date}.json`);
    return JSON.parse(readFileSync(gamesPath, "utf8"));
}

/**
 * Gets Power Index data for today, fetching if necessary
 * @returns {Promise<Object>} Power Index data indexed by team abbreviation
 */
async function getGameMetricsAllData(date, sport) {
    await scrapeGameMetrics(date, sport);

    const powerIndexPath = join(CONFIG.paths.powerIndexDir, sport, `${date}.json`);
    const powerIndexData = JSON.parse(readFileSync(powerIndexPath, "utf8"));

    const matchupQualityPath = join(CONFIG.paths.matchupQualityDir, sport, `${date}.json`);
    const matchupQualityData = JSON.parse(readFileSync(matchupQualityPath, "utf8"));

    return Object.fromEntries(
        Object.entries(matchupQualityData).map(([gameId, matchupQuality]) => [
            gameId,
            {
                ...matchupQuality,
                home: { ...powerIndexData[matchupQuality.home.id], ...matchupQuality.home },
                away: { ...powerIndexData[matchupQuality.away.id], ...matchupQuality.away },
            },
        ])
    );
}

/**
 * Scores all games for a given date
 * @param {string} date - Date in format MM/DD/YYYY
 * @param {string} sport - Sport abbreviation
 * @returns {Promise<Object>} Sorted array of games with scores
 */
async function score_sport_games(date, sport) {
    const sports_config = CONFIG.categories[CONFIG.sports[sport]];

    const games = deepMerge(
        await getScheduleData(date, sport),
        await sports_config.getGameMetricsFunc(date, sport)
    );

    const scoredGames = Object.fromEntries(
        Object.entries(games).map(([gameId, game]) => [
            gameId,
            {
                ...game,
                sport,
                slateScore: (() => {
                    try {
                        return sports_config.getInterestScoreFunc(game, sport);
                    } catch (error) {
                        return -1;
                    }
                })(),
            },
        ])
    );

    return scoredGames;
}

export async function score_sports_games(date, sports) {
    sports = sports.length > 0 ? sports : Object.keys(CONFIG.sports);
    console.log(sports);
    const games = await Promise.all(sports.map((sport) => score_sport_games(date, sport)));
    return combine_maps(games);
}

// Update main execution
const today = getTodayString(1);
score_sports_games(today, []).then(
    (games) => writeFileSync(
        "c:/Users/ethor/python-docs/sports-guide/data/sample/slate_scores.json",
        JSON.stringify(games, null, 4)
    )
);
