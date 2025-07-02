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
import { combine_maps } from "./helpers.js";
import Mailgun from "mailgun.js";
import formData from "form-data";

admin.initializeApp();

const db = admin.firestore();
// ignore null values
db.settings({
  ignoreUndefinedProperties: true,
  timestampsInSnapshots: true,
});
const storage = admin.storage();
const auth = admin.auth();
const mailgun = new Mailgun(formData);

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

// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=baseball&league=mlb
// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=basketball&league=nba
// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=basketball&league=mens-college-basketball
// http://127.0.0.1:5001/slates-59840/us-central1/initializeTeams?sport=hockey&league=nhl
export const initializeTeams = onRequest(
  { cors: true },
  async (req, res) => {
    // teams -> teamID -> "info" -> [abbreviation, logo, name, shortName]
    // parse sport and teams from request
    const sport = req.query.sport as string;
    const league = req.query.league as string;

    if (!sport || !league) {
      res.status(400).send("Missing sport or league");
      return;
    }

    const rawTeams = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=1000`);
    const teamsJSON = await rawTeams.json();
    const teams = teamsJSON.sports[0].leagues[0].teams.map((team: any) => team.team).map((team: any) => {
      return {
        [team.id]: {
          info: {
            abbreviation: team.abbreviation,
            logo: team.logos[0].href.replace(/^.*\.com/g, ""),
            name: team.displayName,
            shortName: team.shortDisplayName,
          },
          colors: {
            primary: team.color,
            alternate: team.alternateColor,
          },
          metrics: {},
        }
      }
    });

    const leagueAdj = league == "mens-college-basketball" ? "ncaambb" : league;
    const teamsRef = db.collection("sports").doc(leagueAdj);
    await teamsRef.set({ teams: combine_maps(teams) }, { merge: true });
    res.status(200).send("Initialized Teams successfully");
  }
);

// // http://127.0.0.1:5001/slates-59840/us-central1/getAllSportsTeams
// export const getAllSportsTeams = onRequest(
//   { cors: true },
//   async (req, res) => {
//     try {
//       const sports = await db.collection("sports").get();
//       const teams = sports.docs.map((sport) => {
//         const teamsData = Object.fromEntries(Object.entries(sport.data().teams).map(([teamId, teamInfo]: [string, any]) => {
//           return [teamId, teamInfo.info];
//         }));
//         return { [sport.id]: teamsData };
//       });
//       res.status(200).json(combine_maps(teams));
//     } catch (error) {
//       logger.error("Error fetching all sports teams:", error);
//       res.status(500).send("Error fetching all sports teams: " + error);
//     }
//   }
// );

// http://127.0.0.1:5001/slates-59840/us-central1/getEspnNetworks
export const getEspnNetworks = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const networks = await db
        .collection("broadcasting")
        .doc("espnNetworks")
        .get();

      res.status(200).json(networks.data());
    } catch (error) {
      logger.error("Error fetching ESPN networks:", error);
      res.status(500).send("Error fetching ESPN networks: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/getRandomQuery?network=KNTV
export const getRandomQuery = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // go through each date in sports/all/schedule/$date and find the game that has tv network = "AZ Family Sports Net"
      const desiredNetwork = req.query.network as string;
      if (!desiredNetwork) {
        res.status(400).send("Missing network query parameter");
        return;
      }

      const snapshot = await db
        .collection("sports")
        .doc("all")
        .collection("schedule")
        .get();
      const dates = snapshot.docs.map((doc) => doc.data());
      const filteredGames = dates.map((date) => {
        const tmp = Object.values(date).map((sport: string) => {
          return Object.values(Object.values(sport)).filter((game: any) => {
            return Object.keys(game.broadcasts || {}).includes(desiredNetwork);
          });
        });
        return tmp;
      });
      res.status(200).json(filteredGames);
    } catch (error) {
      logger.error("Error fetching ESPN networks:", error);
      res.status(500).send("Error fetching ESPN networks: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/sendDailyEmail
export const sendDailyEmail = onRequest(
  { 
    cors: true,
    secrets: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"]
  },
  async (req, res) => {
    try {
      // Get Mailgun configuration from environment variables
      const apiKey = process.env.MAILGUN_API_KEY;
      const domain = process.env.MAILGUN_DOMAIN;
      
      if (!apiKey || !domain) {
        logger.error("Mailgun configuration missing", { 
          hasApiKey: !!apiKey, 
          hasDomain: !!domain 
        });
        throw new Error("Mailgun API key or domain not configured!");
      }

      const mg = mailgun.client({ username: "api", key: apiKey });

      await mg.messages.create(domain, {
        from: "Slates <no-reply@slates.co>",
        to: ["ethaniorlowsky@gmail.com"],
        subject: "Slates Daily Summary",
        text: "Here's your daily summary!",
        html: "<p>Here's your <b>daily summary</b>!</p>",
      });
      
      logger.info("Daily email sent successfully");
      res.json({ message: "Daily email sent successfully" });
    } catch (error) {
      logger.error("Error sending daily email:", error);
      res.status(500).send("Error sending daily email: " + error);
    }
  }
);

// Internal function to generate shareable dashboard token for a specific user
const generateDashboardTokenForUser = async (userId: string, email: string): Promise<{ token: string; shareableUrl: string }> => {
  try {
    // Get user preferences to include in the token
    const userDoc = await db.collection('users').doc(userId).get();
    const userPreferences = userDoc.exists ? userDoc.data() : {};

    const currentTime = Math.floor(Date.now() / 1000);

    // Create custom claims for the token
    const customClaims = {
      role: "tempUser",
      expiresAt: currentTime + (30 * 24 * 60 * 60) // 30 days
    };

    const tempUserId = `${userId}:${email}:${currentTime}`;
    await auth.createUser({ uid: tempUserId, email });
    await db.collection('users').doc(tempUserId).set(userPreferences || {});

    const shareableToken = await auth.createCustomToken(tempUserId, customClaims);
    
    return {
      token: shareableToken,
      shareableUrl: `https://slates.co/shared/${shareableToken}`
    };
  } catch (error) {
    logger.error("Error generating dashboard token for user:", userId, error);
    throw new Error('Failed to generate shareable link');
  }
};

// Example: Generate shareable link for daily email notifications
// This could be called internally when sending daily emails to include a personalized link
// http://127.0.0.1:5001/slates-59840/us-central1/generateEmailDashboardLink?userid=WnFGZ9lVutaARiPUw4OFAOxWfECj&email=info3%40slates%2Eco
export const generateEmailDashboardLink = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // This endpoint could be secured with API keys or internal authentication
      const userId = req.query.userid as string;
      const email = req.query.email as string;

      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      if (!email) {
        res.status(400).json({ error: 'email is required' });
        return;
      }

      // Verify the user exists
      try {
        await auth.getUser(userId);
      } catch (error) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const result = await generateDashboardTokenForUser(userId, email);
      
      // This could be used to send the link via email or return it for other internal processes
      res.status(200).json({ message: 'Dashboard link generated successfully', ...result });
    } catch (error) {
      logger.error("Error in generateEmailDashboardLink:", error);
      res.status(500).json({ error: 'Failed to generate dashboard link' });
    }
  }
);
