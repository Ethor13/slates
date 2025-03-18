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
import fetch from "node-fetch";
import { updateDatesData } from "./scheduledUpdater.js";
import { getProviders } from "./channel-scraper/service_providers.js";

admin.initializeApp();
const db = admin.firestore();
// ignore null values
db.settings({
  ignoreUndefinedProperties: true,
  timestampsInSnapshots: true,
});
const storage = admin.storage();

const ESPN_CDN = "https://a.espncdn.com/";
const UPDATE_SIZE = 14;

// TODO: eventually automatically download all the images based on the teams, instead of checking every time
// Image serving function at root /api endpoint
export const serveImage = onRequest({
  cors: true
}, async (req, res) => {
  try {
    // Get the path from the URL
    const imagePath = req.path.slice(1); // Remove the leading slash

    if (!imagePath) {
      res.status(400).send("Missing image path");
      return;
    }

    // Check if file exists in storage
    const file = storage.bucket().file(imagePath);
    const [exists] = await file.exists();

    if (!exists) {
      logger.log("Image not found in storage, downloading:", imagePath);

      // Download the image
      const response = await fetch(ESPN_CDN + imagePath);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get the image as a buffer
      const imageBuffer = await response.buffer();

      // Upload to Firebase Storage
      await file.save(imageBuffer, {
        public: true,
        metadata: {
          cacheControl: "public, max-age=31536000, immutable", // Cache for a year
          contentType: response.headers.get("content-type") || "image/png"
        }
      });
    }

    // Get file metadata to use for response headers
    const [metadata] = await file.getMetadata();

    // Set cache control headers
    res.set({
      "Cache-Control": metadata.cacheControl || "public, max-age=31536000, immutable",
      "Content-Type": metadata.contentType || "image/png",
    });

    // Stream the file content
    const fileStream = file.createReadStream();

    // Handle stream errors
    fileStream.on("error", (error) => {
      logger.error(`Error streaming image: ${error}`);
      res.status(500).send(`Error streaming image: ${error.message}`);
    });

    // Pipe the file to the response
    fileStream.pipe(res);
  } catch (error) {
    logger.error(`Error serving image: ${error}`);
    res.status(500).send(`Error serving image: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export const scheduledUpdate = onSchedule(
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

// http://127.0.0.1:5001/slates-59840/us-central1/requestUpdate
export const requestUpdate = onRequest(
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