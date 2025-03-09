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

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

enum Sport {
  NBA = "nba",
  NCAAMBB = "ncaambb",
}

interface ScheduleRequest {
  date: string;
  sports: Sport[];
}

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