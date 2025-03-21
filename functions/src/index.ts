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
import { getProviders } from "./channel-scraper/service_providers.js";
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