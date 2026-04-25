import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let db;
let auth;

export const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // Parse service account from env variable or file
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Fallback to file path
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                   path.join(process.cwd(), 'firebase-service-account.json');
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = getFirestore(app);
    auth = app.auth();

    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
};

export const getDB = () => db;
export const getAuth = () => auth;
