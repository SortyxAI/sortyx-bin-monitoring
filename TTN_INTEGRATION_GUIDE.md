# Setting Up The Things Network Integration with Firebase

## 🔗 How to Connect Your IoT Sensors to Firebase

Since your Firebase currently doesn't have sensor data, you need to set up the integration with The Things Network (TTN). Here's how:

### Method 1: TTN Webhook Integration (Recommended)

1. **Configure TTN Webhook:**
   ```javascript
   // TTN Webhook URL should be:
   // https://your-firebase-project.firebaseapp.com/api/ttn-webhook
   
   // Webhook payload format:
   {
     "dev_eui": "device-id",
     "uplink_message": {
       "decoded_payload": {
         "battery": 85,
         "distance": 25,
         "tilt": 2
       },
       "received_at": "2025-01-03T10:00:00Z"
     }
   }
   ```

2. **Create Firebase Cloud Function:**
   ```javascript
   // functions/index.js
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   admin.initializeApp();

   exports.ttnWebhook = functions.https.onRequest(async (req, res) => {
     const data = req.body;
     const deviceId = data.dev_eui;
     
     // Store in device-specific collection
     await admin.database().ref(`sensor-data-${deviceId}`).push({
       ...data.uplink_message.decoded_payload,
       timestamp: data.uplink_message.received_at,
       deviceId: deviceId,
       receivedAt: new Date().toISOString()
     });
     
     res.status(200).send('OK');
   });
   ```

### Method 2: Manual Test Data (For Testing)

Add this test data to your Firebase Realtime Database:

```json
{
  "sensor-data-sortyx-sensor-two": {
    "entry1": {
      "battery": 85,
      "distance": 25,
      "tilt": 2,
      "timestamp": "2025-01-03T10:00:00Z",
      "deviceId": "sortyx-sensor-two"
    }
  },
  "sensor-data-plaese-work": {
    "entry1": {
      "battery": 92,
      "distance": 55,
      "tilt": 1,
      "timestamp": "2025-01-03T10:00:00Z",
      "deviceId": "plaese-work"
    }
  }
}
```

### Method 3: Direct Firebase Write (Testing)

Use the console or add this to your app:

```javascript
import { ref, push } from 'firebase/database';
import { database } from './config/firebase';

// Function to add test sensor data
async function addTestSensorData() {
  const devices = ['sortyx-sensor-two', 'plaese-work'];
  
  for (const deviceId of devices) {
    const sensorRef = ref(database, `sensor-data-${deviceId}`);
    await push(sensorRef, {
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      distance: Math.floor(Math.random() * 80) + 10, // 10-90cm
      tilt: Math.floor(Math.random() * 5), // 0-4 degrees
      timestamp: new Date().toISOString(),
      deviceId: deviceId
    });
  }
}
```

## 🎯 Current Status

- ✅ Firebase service is ready for sensor data
- ⚠️ No sensor data collections found in Firebase
- 🔧 Using mock data for testing until real data is available
- 📡 Need to set up TTN webhook or manually add test data

## 🚀 Quick Test

To test the system with real data:

1. Go to Firebase Console → Realtime Database
2. Add the test data structure shown above
3. Refresh your application
4. Click on bin cards to see live data

The system will automatically switch from mock data to real data once sensor collections are detected!