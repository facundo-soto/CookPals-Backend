import admin from 'firebase-admin';
import { FIREBASE_CONFIG } from './config.js';

const firebaseConfig = JSON.parse(FIREBASE_CONFIG);

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig)
});

export const db = admin.firestore();