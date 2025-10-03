// Firebase Configuration Component
// Add your Firebase credentials here

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Example Firebase Realtime Database structure:
/*
{
  "sensors": {
    "SB-Reception-001": {
      "current_fill": 45.5,
      "temperature": 24.3,
      "humidity": 52.1,
      "air_quality": 85,
      "battery_level": 92,
      "odour_level": 15,
      "timestamp": 1704196800000
    },
    "SB-Cafeteria-002": {
      "current_fill": 78.2,
      "temperature": 26.8,
      "humidity": 58.3,
      "air_quality": 72,
      "battery_level": 85,
      "odour_level": 45,
      "timestamp": 1704196800000
    }
  }
}
*/