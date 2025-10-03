/**
 * Firebase Sensor Data Synchronization Utility
 * This utility fetches sensor data from Firebase and updates SingleBin entities
 */

import { SingleBin } from "@/api/entities";

// Initialize Firebase (you'll need to install firebase package)
// npm install firebase

let firebaseInitialized = false;
let database = null;

export const initializeFirebase = async () => {
  if (firebaseInitialized) return database;
  
  try {
    const { initializeApp } = await import('firebase/app');
    const { getDatabase } = await import('firebase/database');
    const { firebaseConfig } = await import('./FirebaseConfig');
    
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    firebaseInitialized = true;
    
    console.log("Firebase initialized successfully");
    return database;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

/**
 * Fetch sensor data from Firebase and update SingleBin
 * @param {string} uniqueId - The unique_id of the SingleBin
 */
export const fetchAndUpdateSensorData = async (uniqueId) => {
  try {
    const db = await initializeFirebase();
    if (!db) return;

    const { ref, get } = await import('firebase/database');
    const sensorRef = ref(db, `sensors/${uniqueId}`);
    const snapshot = await get(sensorRef);
    
    if (snapshot.exists()) {
      const sensorData = snapshot.val();
      
      // Find the SingleBin by unique_id
      const singleBins = await SingleBin.filter({ unique_id: uniqueId });
      
      if (singleBins.length > 0) {
        const singleBin = singleBins[0];
        
        // Prepare update data
        const updateData = {
          last_sensor_update: new Date().toISOString()
        };
        
        // Only update fields that are enabled in sensors_enabled
        if (singleBin.sensors_enabled?.fill_level && sensorData.current_fill !== undefined) {
          updateData.current_fill = sensorData.current_fill;
        }
        
        if (singleBin.sensors_enabled?.temperature && sensorData.temperature !== undefined) {
          updateData.temperature = sensorData.temperature;
        }
        
        if (singleBin.sensors_enabled?.humidity && sensorData.humidity !== undefined) {
          updateData.humidity = sensorData.humidity;
        }
        
        if (singleBin.sensors_enabled?.air_quality && sensorData.air_quality !== undefined) {
          updateData.air_quality = sensorData.air_quality;
        }
        
        if (singleBin.sensors_enabled?.battery_level && sensorData.battery_level !== undefined) {
          updateData.battery_level = sensorData.battery_level;
        }
        
        if (singleBin.sensors_enabled?.odour_detection && sensorData.odour_level !== undefined) {
          updateData.odour_level = sensorData.odour_level;
        }
        
        // Update the SingleBin
        await SingleBin.update(singleBin.id, updateData);
        
        console.log(`✅ Updated SingleBin ${uniqueId}:`, updateData);
        return updateData;
      } else {
        console.warn(`⚠️ SingleBin with unique_id ${uniqueId} not found`);
      }
    } else {
      console.warn(`⚠️ No sensor data found for ${uniqueId} in Firebase`);
    }
  } catch (error) {
    console.error(`❌ Error fetching sensor data for ${uniqueId}:`, error);
  }
};

/**
 * Set up real-time listener for a SingleBin
 * @param {string} uniqueId - The unique_id of the SingleBin
 * @param {function} onUpdate - Callback function when data updates
 */
export const setupRealtimeListener = async (uniqueId, onUpdate) => {
  try {
    const db = await initializeFirebase();
    if (!db) return null;

    const { ref, onValue } = await import('firebase/database');
    const sensorRef = ref(db, `sensors/${uniqueId}`);
    
    const unsubscribe = onValue(sensorRef, async (snapshot) => {
      if (snapshot.exists()) {
        const sensorData = snapshot.val();
        await fetchAndUpdateSensorData(uniqueId);
        
        if (onUpdate) {
          onUpdate(sensorData);
        }
      }
    });
    
    console.log(`🔄 Real-time listener set up for ${uniqueId}`);
    return unsubscribe;
  } catch (error) {
    console.error(`❌ Error setting up listener for ${uniqueId}:`, error);
    return null;
  }
};

/**
 * Fetch and update all SingleBins
 */
export const syncAllSingleBins = async () => {
  try {
    const singleBins = await SingleBin.list();
    const updatePromises = singleBins.map(bin => 
      fetchAndUpdateSensorData(bin.unique_id)
    );
    
    await Promise.all(updatePromises);
    console.log(`✅ Synced ${singleBins.length} SingleBins from Firebase`);
  } catch (error) {
    console.error("❌ Error syncing all SingleBins:", error);
  }
};

/**
 * Batch update multiple sensors at once
 * @param {Object} sensorDataMap - Map of unique_id to sensor data
 */
export const batchUpdateSensors = async (sensorDataMap) => {
  try {
    const db = await initializeFirebase();
    if (!db) return;

    const { ref, update } = await import('firebase/database');
    const updates = {};
    
    Object.entries(sensorDataMap).forEach(([uniqueId, data]) => {
      updates[`sensors/${uniqueId}`] = {
        ...data,
        timestamp: Date.now()
      };
    });
    
    await update(ref(db), updates);
    console.log(`✅ Batch updated ${Object.keys(sensorDataMap).length} sensors`);
  } catch (error) {
    console.error("❌ Error in batch update:", error);
  }
};