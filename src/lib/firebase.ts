import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDWqRArKenonKTfYkLmo2AtrL8fVNeOyOA",
    authDomain: "slates.co",
    projectId: "slates-59840",
    storageBucket: "slates-59840.appspot.com",
    messagingSenderId: "191042678678",
    appId: "1:191042678678:web:2c1afa9a2e601e39ac77b7",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "slates-59840.firebasestorage.app");

// Connect to emulators in development environment
if (import.meta.env.DEV) {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Auth, Firestore and Storage emulators');
}