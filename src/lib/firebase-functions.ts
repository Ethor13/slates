import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { DocumentData } from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Check if we're in development mode to connect to the local emulator
if (import.meta.env.DEV) {
  // Connect to local emulator running on port 5001
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Connected to Firebase Functions emulator');
}

// Typed wrapper for the getUserData function
interface UserData {
  uid: string;
  name: string;
  email: string;
  preferences: {
    favoriteTeams: string[];
    provider: string;
    zipcode: string;
  };
}

interface ScheduleRequest {
  date: string;
  sport: string;
}

interface ScheduleResponse {
  [x: string]: DocumentData;
}

// Export callable functions
export const getUserDataFunction = httpsCallable<void, UserData>(functions, 'getUserData');
export const scheduleFunction = httpsCallable<ScheduleRequest, ScheduleResponse>(functions, 'schedule');

// Add more function exports as needed