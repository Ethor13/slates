import fetch from "node-fetch";
import { logger } from "firebase-functions";
import { Storage } from "firebase-admin/storage";
import { Firestore } from "firebase-admin/firestore";
import axios from "axios";

const ESPN_CDN = "https://a.espncdn.com/";

// TODO: eventually automatically download all the images based on the teams, instead of checking every time
// Image serving function at root /api endpoint
const downloadImage = async (storage: Storage, imagePath: string) => {
  try {
    // Check if file exists in storage
    const file = storage.bucket().file(imagePath);
    const [exists] = await file.exists();

    if (!exists) {
      logger.log("Image not found in storage, downloading:", imagePath);

      // Download the image
      const response = await axios.get(ESPN_CDN + imagePath, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get the image as a buffer
      const imageBuffer = Buffer.from(response.data);

      // Upload to Firebase Storage
      await file.save(imageBuffer, {
        public: true,
        metadata: {
          cacheControl: "public, max-age=31536000, immutable", // Cache for a year
          contentType: response.headers["content-type"] || "image/png"
        }
      });
    }
  } catch (error) {
    logger.error(`Error serving image: ${error}`);
    throw new Error(`Error serving image: ${error}`);
  }
};

type NestedRecord = Record<string, any>;

export const downloadImages = async (db: Firestore, storage: Storage) => {
  try {
    fetch("https://a.espncdn.com")

    const teamsRef = db.collection("sports");
    const teamsSnapshot = await teamsRef.get();
    if (teamsSnapshot.empty) {
      logger.log("No teams found in Firestore");
      return;
    }

    for (const sport of teamsSnapshot.docs) {
      if (sport.id === "all") continue; // Skip the "all" document
      logger.log("Processing sport:", sport.id);

      const teams: NestedRecord = sport.data().teams;

      for (const team of Object.values(teams)) {
        await downloadImage(storage, (team as NestedRecord).info.logo as string);
      }
    }

    logger.log("All images downloaded successfully");
  } catch (error) {
    logger.error(`Error downloading images: ${error}`);
  }
}