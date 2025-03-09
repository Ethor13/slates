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

interface ScheduleRequest {
  date: string;
  sports: string[];
}

interface ScheduleResponse {
  [x: string]: DocumentData;
}

interface ApiRequest {
  src: string;
}

// Export callable functions
export const scheduleFunction = httpsCallable<ScheduleRequest, ScheduleResponse>(functions, 'schedule');
export const api = httpsCallable<ApiRequest>(functions, 'api');

// Add more function exports as needed