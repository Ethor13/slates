import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { app } from './firebase';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Check if we're in development mode to connect to the local emulator
if (import.meta.env.DEV) {
  // Connect to local emulator running on port 5001
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Connected to Firebase Functions emulator');
}