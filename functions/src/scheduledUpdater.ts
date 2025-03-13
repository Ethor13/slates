/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { Firestore } from "firebase-admin/firestore";
import { updateScheduleInFirestore } from "./scrapers/scrape_schedule.js";
import { updateGameMetrics, updateTeamMetrics } from "./scrapers/scrape_game_metrics.js";
import { scoreSportsGames } from "./scrapers/calculate_slate_scores.js";
import { logger } from "firebase-functions";
import { Sports, GamesData, TeamsData } from "./types.js";
import { datesToUpdate } from "./helpers.js";

export const updateDatesData = async (db: Firestore, updateSize: number) => {
  try {
    const dates = datesToUpdate(updateSize);

    logger.log("Teams data update started");
    // teamsData = sport -> teamId -> metricName -> teamMetric
    const teamsData = await updateTeamsData();

    // Write teams data
    for (const sport of Object.values(Sports)) {
      const sportTeamsRef = db.collection("sports").doc(sport);
      await sportTeamsRef.set({ teams: teamsData[sport] }, { merge: true });
    }

    logger.log("Teams data update completed");

    // Create promises for each sport query
    const dateQueries = dates.map(async (date) => {
      logger.log(`Schedule update started for date ${date}`);
      await updateDateData(db, date, teamsData);
      logger.log(`Schedule update completed for date ${date}`);
    });

    // Execute all queries in parallel
    await Promise.all(dateQueries);
  } catch (error) {
    logger.error("Error in scheduled update:", error);
    throw error;
  }
}

const updateDateData = async (db: Firestore, date: string, teamsData: TeamsData) => {
  try {
    // gamesData = sport -> gameId -> ParsedGame (w/ gameMetrics)
    const gamesData = await updateGamesData(date);
    // add slateScore to gamesData
    await calculateScores(gamesData, teamsData);

    for (const sport of Object.values(Sports)) {
      const sportTeamsRef = db.collection("sports").doc(sport).collection("schedule").doc(date);
      await sportTeamsRef.set(gamesData[sport]);
    }

    // TODO: do one or the other, but try both for now
    // Write games data to Firestore
    const allGamesRef = db.collection("sports").doc("all").collection("schedule").doc(date);
    await allGamesRef.set(gamesData);
  } catch (error) {
    logger.error("Error in scheduled update:", error);
    throw error;
  }
}

async function updateGamesData(date: string): Promise<GamesData> {
  try {
    const res: GamesData = {};

    for (const sport of Object.values(Sports)) {
      await updateScheduleInFirestore(date, sport).then((schedule) => {
        // schedule = gameId -> ParsedGame
        res[sport] = schedule;
      }).catch((error: any) => {
        logger.error("Error updating schedule in Firestore:", error);
        throw new Error("Error updating schedule in Firestore");
      });

      await updateGameMetrics(date, sport).then((gameMetrics) => {
        // gameMetrics = metricName -> gameId -> gameMetric
        Object.entries(gameMetrics).forEach(([_, games]) => {
          Object.entries(games).forEach(([gameId, gameMetric]) => {
            res[sport][gameId] = {
              ...res[sport][gameId],
              home: {
                ...res[sport][gameId].home,
                metrics: {
                  ...res[sport][gameId].home.metrics,
                  ...gameMetric.home,
                }
              },
              away: {
                ...res[sport][gameId].away,
                metrics: {
                  ...res[sport][gameId].away.metrics,
                  ...gameMetric.away,
                },
              },
            };
          });
        }
        )
      }).catch((error: any) => {
        logger.error("Error updating game metrics in Firestore:", error);
        throw new Error("Error updating game metrics in Firestore");
      });
    }

    return res;
  } catch (error) {
    logger.error("Error fetching schedule:", error);
    throw error;
  }
};

async function updateTeamsData(): Promise<TeamsData> {
  try {
    console.log("Fetching Teams Data");

    const res: TeamsData = {};
    for (const sport of Object.values(Sports)) {
      await updateTeamMetrics(sport).then((teamMetrics) => {
        // teamMetrics = metricName -> teamId -> teamMetric
        res[sport] = teamMetrics;
      }).catch((error: any) => {
        logger.error("Error updating team metrics in Firestore:", error);
        throw new Error("Error updating team metrics in Firestore");
      });
    }

    return res;
  } catch (error) {
    logger.error("Error updating teams data:", error);
    throw error;
  }
};

async function calculateScores(gamesData: GamesData, teamsData: TeamsData): Promise<void> {
  try {
    for (const sport of Object.values(Sports)) {
      await scoreSportsGames(sport, gamesData[sport], teamsData[sport]).then((gameScores) => {
        // gameScores = gameId -> score
        Object.entries(gameScores).forEach(([gameId, score]) => {
          gamesData[sport][gameId].slateScore = score;
        });
      }).catch((error: any) => {
        logger.error("Error scoring games in Firestore:", error);
        throw new Error("Error scoring games in Firestore");
      });
    }
  } catch (error) {
    logger.error("Error updating scores:", error);
    throw error;
  }
}