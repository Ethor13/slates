/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { Firestore } from "firebase-admin/firestore";
import { updateScheduleInFirestore } from "./sports-scrapers/scrape_schedule.js";
import { updateGameMetrics, updateTeamMetrics } from "./sports-scrapers/scrape_game_metrics.js";
import { scoreSportsGames } from "./sports-scrapers/calculate_slate_scores.js";
import { logger } from "firebase-functions";
import { Sports, GamesData, TeamsData, ParsedTeams, ParsedGame } from "./types.js";
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
      if (Object.keys(teamsData[sport]).length > 0) {
        await sportTeamsRef.set({ teams: teamsData[sport] }, { merge: true });
      }
      teamsData[sport] = (await sportTeamsRef.get()).data() as ParsedTeams;
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
    // add colors to gamesData
    addColorsToGamesData(gamesData, teamsData);

    const batch = db.batch();

    for (const sport of Object.values(Sports)) {
      const sportTeamsRef = db.collection("sports").doc(sport).collection("schedule").doc(date);
      batch.set(sportTeamsRef, gamesData[sport]);
    }

    // TODO: do one or the other, but try both for now
    // Write games data to Firestore
    const allGamesRef = db.collection("sports").doc("all").collection("schedule").doc(date);
    batch.set(allGamesRef, gamesData);

    const today = datesToUpdate(1)[0];

    if (date == today) {
      // get best game from gamesData
      let bestGame: ParsedGame | undefined = undefined;

      Object.values(gamesData).forEach(sportGames => {
        Object.values(sportGames).forEach(game => {
          bestGame = bestGame && game.slateScore < bestGame.slateScore ? bestGame : game;
        });
      }
      );

      const bestGameRef = db.collection("sports").doc("today");
      batch.set(bestGameRef, bestGame);
    }

    // Add networks to networks master list
    // need to manually add a mapper item on firestore
    // mapper = {
    //   key: string,
    //   values: string[]  
    // }[]
    const networksRef = db.collection("broadcasting").doc("espnNetworks");
    Object.values(Sports).forEach((sport) => {
      Object.values(gamesData[sport]).forEach((game) => {
        batch.set(networksRef, game.broadcasts, { merge: true });
      });
    });

    await batch.commit();
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
      await scoreSportsGames(sport, gamesData[sport], teamsData[sport].teams).then((gameScores) => {
        // gameScores = gameId -> score
        Object.entries(gameScores).forEach(([gameId, { slateScore, scoreComponents }]) => {
          gamesData[sport][gameId].slateScore = slateScore;
          gamesData[sport][gameId].scoreComponents = scoreComponents;
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

function addColorsToGamesData(gamesData: GamesData, teamsData: TeamsData): void {
  try {
    const tbdColors = {
      primary: "888888",
      alternate: "888888"
    }

    for (const sport of Object.values(Sports)) {
      Object.entries(gamesData[sport]).forEach(([gameId, game]) => {
        const homeTeam = teamsData[sport].teams[game.home.id];
        const awayTeam = teamsData[sport].teams[game.away.id];

        gamesData[sport][gameId].home.colors = homeTeam?.colors || tbdColors;
        gamesData[sport][gameId].away.colors = awayTeam?.colors || tbdColors;
      });
    }
  } catch (error) {
    logger.error("Error adding colors to games data:", error);
    throw error;
  }
}