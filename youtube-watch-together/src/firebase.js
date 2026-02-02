// firebase.js or firebaseConfig.js

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  remove,
  update,
  off,
  onDisconnect,
  get
} from 'firebase/database';

import { getAuth, signInAnonymously } from 'firebase/auth';

// ✅ 1. Initialize Firebase app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// ✅ 2. Initialize Auth and sign in anonymously
const auth = getAuth(app);
signInAnonymously(auth)
  .then((userCredential) => {
    console.log('✅ Signed in anonymously as:', userCredential.user.uid);
  })
  .catch((error) => {
    console.error('❌ Anonymous sign-in failed:', error);
  });

// ✅ 3. Initialize Database
const db = getDatabase(app);

// ✅ 4. Export what you need
export {
  db,
  auth,
  ref,
  set,
  onValue,
  push,
  remove,
  update,
  off,
  onDisconnect,
  get
};
