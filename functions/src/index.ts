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

// http://127.0.0.1:5001/slates-59840/us-central1/getTeamIds
export const getTeamIds = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // for each sports in the sports collection, map each team to it's id
      const sportsSnapshot = await db.collection("sports").get();
      const sports = sportsSnapshot.docs.map((doc) => {
        if (doc.id === "all") return {};

        const teams = Object.entries(doc.data().teams || {}).map(([teamId, teamInfo]) => {
          return { [(teamInfo as any).info.name]: teamId };
        });
        return { [doc.id]: combine_maps(teams) };
      });
      res.status(200).json(combine_maps(sports));
    } catch (error) {
      res.status(500).send("Error: " + error);
    }
  }
);

// http://127.0.0.1:5001/slates-59840/us-central1/getRandomQuery
export const getRandomQuery = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // for each sports in the sports collection, map each team to it's id
      const ncaambbDoc = await db.collection("sports").doc("ncaambb").get();
      const ncaambbTeams = ncaambbDoc.data()?.teams || {};

      const conferences = new Set<string>();
      Object.values(ncaambbTeams).forEach((teamInfo) => {
        conferences.add((teamInfo as any).info.divisionName);
      });

      res.status(200).json(JSON.parse(JSON.stringify(Array.from(conferences).sort((a, b) => a.localeCompare(b)))));
    } catch (error) {
      res.status(500).send("Error: " + error);
    }
  }
);

// Internal utility function to send daily email to a specific user
const sendDailyEmailToUser = async (recipientEmail: string, link: string): Promise<void> => {
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

  // Get today"s date for template variables
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric" 
  });

  // Customize template variables
  const templateVariables = {
    date: today,
    link,
  };

  await mg.messages.create(domain, {
    from: "Slates <no-reply@slates.co>",
    to: [recipientEmail],
    subject: `Slates Summary for ${today}`,
    template: "slates daily email",
    "h:X-Mailgun-Variables": JSON.stringify(templateVariables),
  });
};

// Scheduled daily email sending at 8am Eastern Time
export const scheduledDailyEmail = onSchedule(
  { 
    schedule: "0 8 * * *",
    timeZone: "America/New_York",
    secrets: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"]
  },
  async () => {
    try {
      // Get all users from the database
      const usersSnapshot = await db.collection("users").get();
      
      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      // Iterate through all users and send emails using the existing sendDailyEmailToUser function
      for (const userDoc of usersSnapshot.docs) {
        try {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Skip Guest Accounts
          if (userId.endsWith(":Guest")) {
            logger.info(`Temp User ${userId}, skipping`);
            continue;
          }

          const recipient_list = userData.notificationEmails || [];

          // Generate personalized link
          const guestUrl = await generateDashboardTokenForUser(userId, false);

          // Use the existing sendDailyEmailToUser function
          for (const recipientEmail of recipient_list) {
            try {
              await sendDailyEmailToUser(recipientEmail, guestUrl);
              successCount++;
            } catch (error) {
              errorCount++;
              const errorInfo = {
                userId: userId,
                email: recipientEmail,
                error: error instanceof Error ? error.message : String(error)
              };
              errors.push(errorInfo);
              logger.error(`Failed to send email to ${recipientEmail}:`, error);
            }
          }

        } catch (userError) {
          logger.error(`Failed to send emails for user ${userDoc.id}:`, userError);
        }
      }
      logger.info(`Scheduled daily email operation completed: ${successCount} sent, ${errorCount} failed`);
    } catch (error) {
      logger.error("Error in scheduled daily email operation:", error);
      throw error;
    }
  }
);

// Internal function to generate shareable dashboard token for a specific user
const generateDashboardTokenForUser = async (userId: string, owner: boolean): Promise<string> => {
  try {
    // Get user preferences to include in the token
    const userDoc = await db.collection("users").doc(userId).get();
    const userPreferences = userDoc.exists ? userDoc.data() : {};
    const userEmail = await auth.getUser(userId).then(user => user.email);

    if (owner) {
      const shareableToken = await auth.createCustomToken(userId);
      return `https://slates.co/shared/${shareableToken}`
    } else {
      const tempUserId = `${userId}:${userEmail}:Guest`;

      try {
        // User already exists, no need to create
        await auth.getUser(tempUserId);
      } catch (error) {
        // User doesn't exist, create it
        logger.log(error);
        await auth.createUser({ uid: tempUserId });
      }

      const { notificationEmails, ...userPreferencesWithoutEmails } = userPreferences || {};
      await db.collection("users").doc(tempUserId).set(userPreferencesWithoutEmails);

      const shareableToken = await auth.createCustomToken(tempUserId);
      return `https://slates.co/shared/${shareableToken}`
    }
  } catch (error) {
    logger.error("Error generating dashboard token for user:", userId, error);
    throw new Error("Failed to generate shareable link");
  }
};

// Example: Generate shareable link for daily email notifications
// This could be called internally when sending daily emails to include a personalized link
// http://127.0.0.1:5001/slates-59840/us-central1/generateDashboardLink?userid=WnFGZ9lVutaARiPUw4OFAOxWfECj
export const generateDashboardLink = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      // This endpoint could be secured with API keys or internal authentication
      const userId = req.query.userid as string;

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      // Verify the user exists
      try {
        await auth.getUser(userId);
      } catch (error) {
        res.status(404).json({ error: `User not found ${error}` });
        return;
      }

      const shareableUrl = await generateDashboardTokenForUser(userId, false);
      
      // This could be used to send the link via email or return it for other internal processes
      res.status(200).json({ message: "Dashboard link generated successfully", shareableUrl });
    } catch (error) {
      logger.error("Error in generateDashboardLink:", error);
      res.status(500).json({ error: "Failed to generate dashboard link" });
    }
  }
);
