/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { onCall } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import admin from "firebase-admin";
import { updateScheduleInFirestore } from "./scrapers/scrape_schedule.js";
import { updateGameMetrics } from "./scrapers/scrape_game_metrics.js";
import { scoreSportsGames } from "./scrapers/calculate_slate_scores.js";
import { combine_maps, needsUpdate } from "./helpers.js";
import { logger } from "firebase-functions";
import fetch from "node-fetch";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();
db.settings({ ignoreUndefinedProperties: true });

enum Sport {
  NBA = "nba",
  NCAAMBB = "ncaambb",
}

interface ScheduleRequest {
  date: string;
  sports: Sport[];
}

interface ProxyImageRequest {
  imageUrl: string;
  storagePath: string;
}

// New function to proxy images through Firebase Storage
export const proxyImage = onCall<ProxyImageRequest>(async (request) => {
  try {
    const { imageUrl, storagePath } = request.data;
    
    if (!imageUrl) {
      throw new Error("Missing required parameter: imageUrl");
    }
    
    if (!storagePath) {
      throw new Error("Missing required parameter: storagePath");
    }
    
    // Check if file already exists in storage
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      logger.log("Image not found in storage, downloading:", imageUrl);
      
      // Download the image
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Get the image as a buffer
      const imageBuffer = await response.buffer();
      
      // Upload to Firebase Storage
      await file.save(imageBuffer, {
        contentType: response.headers.get("content-type") || "image/png",
        public: true,
        metadata: {
          originalUrl: imageUrl,
          cacheControl: "public, max-age=31536000" // Cache for a year
        }
      });
      
      logger.log("Image successfully uploaded to:", storagePath);
    } else {
      logger.log("Image already exists in storage:", storagePath);
    }
    
    // Get the download URL
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 31536000000, // URL valid for a year
    });
    
    return { url };
  } catch (error) {
    logger.error("Error proxying image:", error);
    throw new Error(`Error proxying image: ${error instanceof Error ? error.message : String(error)}`);
  }
});

export const schedule = onCall<ScheduleRequest>(async (request) => {
  try {
    // Parse date and sport parameters from the request
    // Check query parameters first, then request body for POST requests
    const date = request.data.date;
    const sports = request.data.sports;

    // Validate parameters
    if (!date) {
      throw new Error("Missing required parameter: date");
    }

    if (!sports) {
      throw new Error("Missing required parameter: sports");
    }

    console.log("Fetching schedule for date:", date, "and sports:", sports);

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
      }

      const scheduleSnapshot = await sportRef.collection("games").get();
      sportsData.push(combine_maps(scheduleSnapshot.docs.map(doc => ({ [doc.id]: doc.data() }))));
    }

    const combined = combine_maps(sportsData);
    return combined;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
});