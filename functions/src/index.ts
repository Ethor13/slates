/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { updateScheduleInFirestore } from "./scrapers/scrape_schedule.js";
import { updateGameMetrics } from "./scrapers/scrape_game_metrics.js";
import { scoreSportsGames } from "./scrapers/calculate_slate_scores.js";
import { combine_maps, needsUpdate, mappify } from "./helpers.js";
import { logger } from "firebase-functions";
import fetch from "node-fetch";

admin.initializeApp();
const storage = admin.storage().bucket();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const ESPN_CDN = "https://a.espncdn.com/";

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
    const file = storage.file(imagePath);
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

export const schedule = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const date = req.query.date as string;

      // Validate date parameter
      if (!date) {
        res.status(400).json({ error: "Missing required parameter: date" });
        return;
      }

      console.log("Fetching schedule for date:", date);

      // Initialize with current time
      let minLastUpdated = new Date();

      // Get all supported sports
      const sports = ["nba", "ncaambb"];
      const sportsData = [];

      for (const sport of sports) {
        // Check if data was updated within the last hour
        const sportRef = db.collection("schedule").doc(date).collection("sports").doc(sport);
        const metadataSnapshot = await sportRef.get();
        const lastUpdated = metadataSnapshot.exists ? metadataSnapshot.data()?.lastUpdated?.toDate() : null;

        if (!lastUpdated || needsUpdate(lastUpdated, 1)) {
          // TODO: make this a callable function (non-exportable) and add a lock mechanism so we only ever update once
          // at a time. Considerations: if we get caught at a lock, then when we get released, don't scrape again
          const batch1 = db.batch();

          await updateScheduleInFirestore(db, batch1, date, sport).catch((error: any) => {
            logger.error("Error updating schedule in Firestore:", error);
            throw new Error("Error updating schedule in Firestore");
          });

          await updateGameMetrics(db, batch1, date, sport).catch((error: any) => {
            logger.error("Error updating game metrics in Firestore:", error);
            throw new Error("Error updating game metrics in Firestore");
          });

          await batch1.commit();

          const batch2 = db.batch();

          await scoreSportsGames(db, batch2, date, sport).catch((error: any) => {
            logger.error("Error scoring games in Firestore:", error);
            throw new Error("Error scoring games in Firestore");
          });

          batch2.set(sportRef, { lastUpdated: FieldValue.serverTimestamp() }, { merge: true });

          await batch2.commit();
        } else if (lastUpdated) {
          // If this sport's data is older than our current minimum, update minLastUpdated
          if (lastUpdated < minLastUpdated) {
            minLastUpdated = lastUpdated;
          }
        }

        const scheduleSnapshot = await sportRef.collection("games").get();
        sportsData.push(combine_maps(scheduleSnapshot.docs.map(doc => ({ [doc.id]: { ...doc.data(), sport } }))));
      }

      const combined = mappify(sports, sportsData);

      // Set cache headers based on oldest last update time
      const secondsSinceUpdate = Math.floor((Date.now() - minLastUpdated.getTime()) / 1000);
      const maxAge = Math.max(3600 - secondsSinceUpdate, 60); // Cache for up to an hour, minimum 60 seconds

      res.set("Cache-Control", `public, max-age=${maxAge}`).json(combined);
      return;
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "An unknown error occurred"
      });
      return;
    }
  });