import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Debug: Log environment variables to verify they're loaded
console.log('🔍 Firebase Environment Variables Check:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete!');
  console.error('Please ensure .env file exists with all required VITE_FIREBASE_* variables');
  console.error('Current config:', firebaseConfig);
  throw new Error('Firebase configuration missing required fields');
}

console.log('✅ Firebase configuration loaded successfully');
console.log('📡 Connecting to Firebase project:', firebaseConfig.projectId);

// Initialize Firebase
let app;
let database;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');

  // Initialize Realtime Database
  database = getDatabase(app);
  console.log('✅ Firebase Realtime Database initialized');

  // Initialize Firestore
  db = getFirestore(app);
  console.log('✅ Firestore initialized successfully');
  console.log('🔥 Firestore instance:', db);

  // Initialize Auth
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Error details:', error.message);
  throw error;
}

export { database, db, auth };
export default app;