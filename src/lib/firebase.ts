import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDWqRArKenonKTfYkLmo2AtrL8fVNeOyOA",
    authDomain: "slates.co",
    projectId: "slates-59840",
    storageBucket: "slates-59840.appspot.com",
    messagingSenderId: "191042678678",
    appId: "1:191042678678:web:2c1afa9a2e601e39ac77b7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);