/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { logger } from "firebase-functions";
import { updateDatesData } from "./scheduledUpdater.js";
import { getProviders, getChannels } from "./channel-scraper/service_providers.js";
import { downloadImages } from "./sports-scrapers/scrape_images.js";

admin.initializeApp();
const db = admin.firestore();
// ignore null values
db.settings({
  ignoreUndefinedProperties: true,
  timestampsInSnapshots: true,
});
const storage = admin.storage();

const UPDATE_SIZE = 14;

// http://127.0.0.1:5001/slates-59840/us-central1/requestImgUpdate
export const requestImgUpdate = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      await downloadImages(db, storage);
      res.status(200).send("Downloaded Images successfully");
    } catch (error) {
      logger.error("Error in image download request:", error);
      res.status(500).send("Error in image download request: " + error);
    }
  }
);

export const scheduledGamesUpdate = onSchedule(
  { schedule: "every 1 hours" },
  async () => {
    try {
      await updateDatesData(db, UPDATE_SIZE);
      logger.info("Scheduled update completed successfully");
    } catch (error) {
      logger.error("Error in scheduled update:", error);
      throw error;
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/requestGamesUpdate
export const requestGamesUpdate = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      await updateDatesData(db, UPDATE_SIZE);
      res.status(200).send("Update completed successfully");
    } catch (error) {
      logger.error("Error in request update:", error);
      res.status(500).send("Error in request update: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/serviceProviders?zipcode=02145
export const serviceProviders = onRequest(
  { cors: true },
  async (req, res) => {
    const zipcode = req.query.zipcode as string;
    if (!zipcode) {
      res.status(400).send("Missing zipcode");
      return;
    }

    try {
      const providers = await getProviders(zipcode);
      res.status(200).json(providers);
    } catch (error) {
      logger.error("Error fetching service providers:", error);
      res.status(500).send("Error fetching service providers: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/channels?providerId=9166050680
export const channels = onRequest(
  { cors: true },
  async (req, res) => {
    const providerId = req.query.providerId as string;
    if (!providerId) {
      res.status(400).send("Missing providerId");
      return;
    }

    try {
      const channels = await getChannels(providerId);
      // add cache control headers for up to 1 month
      res.set("Cache-Control", "public, max-age=2592000");
      // set content type to application/json
      res.set("Content-Type", "application/json");
      res.status(200).json(channels);
    } catch (error) {
      logger.error("Error fetching provider Channels:", error);
      res.status(500).send("Error fetching provider Channels: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=mlb&teams=30
// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=nhl&teams=32
export const initializeTeams = onRequest(
  { cors: true },
  async (req, res) => {
    // teams -> teamID -> "info" -> [abbreviation, logo, name, shortName]
    // parse sport and teams from request
    const sport = req.query.sport as string;
    const teams = req.query.teams as unknown as number;

    if (!sport || !teams) {
      res.status(400).send("Missing sport or teams");
      return;
    }

    const allDates = await db.collection("sports").doc(sport).collection("schedule").get();
    const teamData: Record<string, any> = {};
    let teamIds = new Set<string>();
    for (const date of allDates.docs) {
      for (const [_, game] of Object.entries(date.data())) {
        for (const team of [game.home, game.away]) {
          if (!teamIds.has(team.id)) {
            teamIds.add(team.id);
            teamData[team.id] = {
              info: {
                abbreviation: team.abbreviation,
                logo: team.logo.replace(/\/scoreboard/g, ""),
                name: team.name,
                shortName: team.shortName,
              },
              metrics: {}
            }
            if (teamIds.size >= teams) {
              const teamsRef = db.collection("sports").doc(sport);
              teamsRef.set({ teams: teamData }, { merge: true });
              res.status(200).send("Initialized Teams successfully");
              return;
            }
          }
        }
      }
    }
  }
);

// // http://127.0.0.1:5001/slates-59840/us-central1/getEspnNetworks
// export const getEspnNetworks = onRequest(
//   { cors: true },
//   async (req, res) => {
//     try {
//       const networks = await db
//         .collection("broadcasting")
//         .doc("espnNetworks")
//         .get();

//       res.status(200).json(networks.data());
//     } catch (error) {
//       logger.error("Error fetching ESPN networks:", error);
//       res.status(500).send("Error fetching ESPN networks: " + error);
//     }
//   }
// );

// // http://127.0.0.1:5001/slates-59840/us-central1/getRandomQuery
// export const getRandomQuery = onRequest(
//   { cors: true },
//   async (req, res) => {
//     try {
//       // go through each date in sports/all/schedule/$date and find the game that has tv network = "AZ Family Sports Net"
//       const snapshot = await db
//         .collection("sports")
//         .doc("all")
//         .collection("schedule")
//         .get();
//       const dates = snapshot.docs.map((doc) => doc.data());
//       const filteredGames = dates.map((date) => {
//         const tmp = Object.values(date).map((sport: string) => {
//           return Object.values(Object.values(sport)).filter((game: any) => {
//             return Object.keys(game.broadcasts || {}).includes("FanDuel SN DET Ext");
//           });
//         });
//         console.log(tmp);
//         return tmp;
//       });
//       res.status(200).json(filteredGames);
//     } catch (error) {
//       logger.error("Error fetching ESPN networks:", error);
//       res.status(500).send("Error fetching ESPN networks: " + error);
//     }
//   }
// );