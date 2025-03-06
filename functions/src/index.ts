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
import * as admin from "firebase-admin";
// import { scrapeGameMetrics } from "./scrapers/scrape_game_metrics.js";
import { updateScheduleInFirestore } from "./scrapers/scrape_schedule";
import { updateGameMetrics } from "./scrapers/scrape_game_metrics";
import { combine_maps, needsUpdate } from "./helpers";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

interface ScheduleRequest {
  date: string;
  sport: string;
}

interface ScheduleResponse {
  [x: string]: admin.firestore.DocumentData;
}

export const schedule = onCall<ScheduleRequest, Promise<ScheduleResponse>>(async (request) => {
  try {
    // Parse date and sport parameters from the request
    // Check query parameters first, then request body for POST requests
    const date = request.data.date;
    const sport = request.data.sport;

    // Validate parameters
    if (!date) {
      throw new Error("Missing required parameter: date");
    }

    if (!sport) {
      throw new Error("Missing required parameter: sport");
    }

    // Check if data was updated within the last hour
    const sportRef = db.collection("schedule").doc(date).collection("sports").doc(sport);
    const metadataSnapshot = await sportRef.get();

    if (metadataSnapshot.exists) {
      if (needsUpdate(metadataSnapshot.data()?.lastUpdated?.toDate(), 1)) {
        // TODO: make this a callable function (non-exportable) and add a lock mechanism so we only ever update once at a time
        // Considerations: if we get caught at a lock, then when we get released, don't scrape again
        const batch = db.batch();

        await updateScheduleInFirestore(db, batch, date, sport);
        await updateGameMetrics(db, batch, date, sport);
        batch.set(sportRef, { lastUpdated: FieldValue.serverTimestamp() }, { merge: true });

        await batch.commit();
      }
    }

    const scheduleSnapshot = await sportRef.collection("games").get();
    return combine_maps(scheduleSnapshot.docs.map(doc => ({ [doc.id]: doc.data() })));

  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
});