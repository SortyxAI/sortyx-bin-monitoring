import { database, db, auth } from '../config/firebase';
import { ref, onValue, push, set, get, query, orderByChild, limitToLast, orderByKey, child } from 'firebase/database';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, orderBy, limit, where, query as firestoreQuery } from 'firebase/firestore';

// ✅ Helper function to get current user ID from Firebase Auth
const getCurrentUserId = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user?.uid || null);
    });
  });
};

// ✅ Import debug logging system
const logger = (() => {
  try {
    return require('../utils').logger;
  } catch {
    // Fallback if logger not available
    return {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: () => {},
      trace: () => {},
      success: () => {},
      group: () => {},
      groupEnd: () => {}
    };
  }
})();

const MODULE = 'FirebaseService';

// ✅ Alert generation lock to prevent concurrent executions
let isGeneratingAlerts = false;
let lastAlertCheck = null;
const ALERT_CHECK_COOLDOWN = 5000; // 5 seconds cooldown between checks

export class FirebaseService {
  
  // Verify Firestore connection
  static async verifyConnection() {
    try {
      logger.debug(MODULE, 'Verifying Firestore connection...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore instance (db) is not initialized');
        return false;
      }
      
      logger.trace(MODULE, 'Firestore instance exists:', db);
      
      // Try to read a test collection to verify connection
      const testCollection = collection(db, 'health-check');
      const testQuery = firestoreQuery(testCollection, limit(1));
      const snapshot = await getDocs(testQuery);
      
      logger.success(MODULE, 'Firestore connection verified', { documents: snapshot.size });
      return true;
      
    } catch (error) {
      logger.error(MODULE, 'Firestore connection verification failed:', error);
      
      if (error.code === 'permission-denied') {
        logger.warn(MODULE, 'Firestore security rules are blocking access');
      } else if (error.code === 'unavailable') {
        logger.warn(MODULE, 'Network connection issue - check internet connectivity');
      }
      
      return false;
    }
  }
  
  // Dynamically discover available collections in Firestore
  static async discoverCollections() {
    try {
      logger.debug(MODULE, 'Discovering Firestore collections...');
      
      const knownPatterns = [
        'iot-devices', 'smart-bins', 'single-bins', 'compartments',
        'alerts', 'users'
      ];
      
      const foundCollections = [];
      
      for (const pattern of knownPatterns) {
        try {
          const testRef = collection(db, pattern);
          const testSnapshot = await getDocs(firestoreQuery(testRef, limit(1)));
          if (!testSnapshot.empty) {
            foundCollections.push(pattern);
            logger.trace(MODULE, `Found collection: ${pattern}`, { documents: testSnapshot.size });
          }
        } catch (error) {
          logger.trace(MODULE, `Skipping collection: ${pattern}`);
        }
      }
      
      logger.debug(MODULE, 'Discovered collections:', foundCollections);
      return foundCollections;
      
    } catch (error) {
      logger.error(MODULE, 'Error discovering collections:', error);
      return [];
    }
  }
  
  // Get all sensor data collections from FIRESTORE (now dynamic)
  static async getSensorCollections() {
    try {
      logger.debug(MODULE, 'Getting sensor data collections from Firestore...');
      
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        logger.error(MODULE, 'Firestore connection failed - returning empty array');
        return [];
      }
      
      const discoveredCollections = await this.discoverCollections();
      const sensorCollections = discoveredCollections.filter(name => 
        name.includes('sensor-data') || name.includes('iot-data')
      );
      
      if (sensorCollections.length > 0) {
        logger.success(MODULE, 'Found sensor collections:', sensorCollections);
        return sensorCollections;
      }
      
      const knownCollections = [
        'all-sensor-data', 'sensor-data-plaese-work',
        'sensor-data-sortyx-sensor-two', 'sensor-data-sortyx-sensor-three',
        'sensor-data-sortyx-sensor-four', 'sensor-data-sortyx-sensor-five',
        'iot-data', 'health-check'
      ];
      
      logger.debug(MODULE, 'Using fallback sensor collections:', knownCollections);
      return knownCollections;
      
    } catch (error) {
      logger.error(MODULE, 'Error getting sensor collections:', error);
      return [];
    }
  }

  // ✅ Helper: Get device name (collection name pattern) from device ID by checking user's configured devices
  static async getDeviceNameById(deviceIdOrName, userId = null) {
    try {
      // If it already looks like a device name (not a numeric ID), return it
      if (isNaN(deviceIdOrName)) {
        logger.trace(MODULE, `Device identifier is already a name: ${deviceIdOrName}`);
        return deviceIdOrName;
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }

      if (!userId) {
        logger.warn(MODULE, 'No user ID provided to resolve device name');
        return deviceIdOrName; // Fallback to original value
      }

      // Get user's configured devices
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        logger.warn(MODULE, 'User profile not found');
        return deviceIdOrName;
      }
      
      const userData = userSnapshot.data();
      const configuredDevices = userData.iot_devices || [];
      
      // Find the device by ID
      const device = configuredDevices.find(d => d.id === deviceIdOrName || d.id === String(deviceIdOrName));
      
      if (device && device.name) {
        logger.success(MODULE, `Resolved device ID ${deviceIdOrName} to name: ${device.name}`);
        return device.name; // This is the collection name pattern
      }
      
      logger.warn(MODULE, `Could not resolve device ID ${deviceIdOrName} to a device name`);
      return deviceIdOrName; // Fallback to original value
      
    } catch (error) {
      logger.error(MODULE, 'Error resolving device name from ID:', error);
      return deviceIdOrName; // Fallback to original value
    }
  }

  // Get latest sensor data for a specific device from FIRESTORE - OPTIMIZED
  static async getLatestSensorData(deviceIdOrName = 'sortyx-sensor-two', userId = null) {
    logger.debug(MODULE, `Getting latest sensor data for device: ${deviceIdOrName}`);
    
    try {
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return null;
      }
      
      // Resolve device ID to device name (collection name pattern) if needed
      const deviceName = await this.getDeviceNameById(deviceIdOrName, userId);
      const deviceCollection = `sensor-data-${deviceName}`;
      
      logger.trace(MODULE, `Checking Firestore collection: ${deviceCollection}`);
      
      const deviceCollectionRef = collection(db, deviceCollection);
      
      try {
        const deviceQuery = firestoreQuery(
          deviceCollectionRef,
          orderBy('receivedAt', 'desc'),
          limit(1)
        );
        
        const deviceSnapshot = await getDocs(deviceQuery);
        
        if (!deviceSnapshot.empty) {
          const latestDoc = deviceSnapshot.docs[0];
          const data = latestDoc.data();
          logger.success(MODULE, `Found latest data in ${deviceCollection}`);
          return this.formatSensorData(data);
        }
      } catch (orderByError) {
        logger.trace(MODULE, 'OrderBy failed, trying without ordering...');
        const simpleQuery = firestoreQuery(deviceCollectionRef, limit(1));
        const deviceSnapshot = await getDocs(simpleQuery);
        
        if (!deviceSnapshot.empty) {
          const latestDoc = deviceSnapshot.docs[0];
          const data = latestDoc.data();
          logger.success(MODULE, `Found data in ${deviceCollection} (unordered)`);
          return this.formatSensorData(data);
        }
      }
      
      logger.trace(MODULE, `Trying fallback: all-sensor-data collection`);
      const allDataRef = collection(db, 'all-sensor-data');
      
      try {
        const allDataQuery = firestoreQuery(
          allDataRef,
          orderBy('receivedAt', 'desc'),
          limit(10)
        );
        
        const allSnapshot = await getDocs(allDataQuery);
        
        if (!allSnapshot.empty) {
          const deviceDoc = allSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.deviceId === deviceName || 
                   data.end_device_ids?.device_id === deviceName ||
                   doc.id.includes(deviceName);
          });
          
          if (deviceDoc) {
            const latestData = deviceDoc.data();
            logger.success(MODULE, `Found data in all-sensor-data for ${deviceName}`);
            return this.formatSensorData(latestData);
          }
        }
      } catch (allDataError) {
        logger.trace(MODULE, 'OrderBy failed on all-sensor-data, trying without ordering...');
        const simpleQuery = firestoreQuery(allDataRef, limit(10));
        const allSnapshot = await getDocs(simpleQuery);
        
        if (!allSnapshot.empty) {
          const deviceDoc = allSnapshot.docs.find(doc => {
            const data = doc.data();
            return data.deviceId === deviceName || 
                   data.end_device_ids?.device_id === deviceName ||
                   doc.id.includes(deviceName);
          });
          
          if (deviceDoc) {
            const latestData = deviceDoc.data();
            logger.success(MODULE, `Found data in all-sensor-data for ${deviceName} (unordered)`);
            return this.formatSensorData(latestData);
          }
        }
      }
      
      logger.warn(MODULE, `No sensor data found for device: ${deviceIdOrName} (resolved to: ${deviceName}, collection: ${deviceCollection})`);
      return null;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching latest sensor data:', error);
      
      if (error.code === 'permission-denied') {
        logger.warn(MODULE, 'Permission denied - check Firestore security rules');
      }
      
      return null;
    }
  }

  // Get available IoT devices from user's profile configuration - USER-BASED
  static async getAvailableDevices(userId = null) {
    try {
      logger.debug(MODULE, 'Getting IoT devices from user profile configuration', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }

      if (!userId) {
        logger.warn(MODULE, 'No user ID provided or found');
        return [];
      }
      
      // Get user's profile to retrieve configured IoT devices
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (!userSnapshot.exists()) {
        logger.warn(MODULE, 'User profile not found');
        return [];
      }
      
      const userData = userSnapshot.data();
      const configuredDevices = userData.iot_devices || [];
      
      if (configuredDevices.length === 0) {
        logger.info(MODULE, 'No IoT devices configured in user profile');
        return [];
      }
      
      logger.debug(MODULE, `Found ${configuredDevices.length} configured IoT devices in user profile`);
      
      // Enrich each device with latest sensor data
      const enrichedDevices = await Promise.all(
        configuredDevices.map(async (device) => {
          try {
            const deviceId = device.name; // device.name is the collection name pattern
            const collectionName = `sensor-data-${deviceId}`;
            
            logger.trace(MODULE, `Checking sensor data for device: ${deviceId}`);
            
            // Try to get latest sensor data
            const sensorData = await this.getLatestSensorData(deviceId);
            
            if (sensorData) {
              logger.success(MODULE, `Device ${deviceId} has active sensor data`);
              return {
                id: device.id,
                deviceId: deviceId,
                name: deviceId,
                type: device.type,
                collectionName: collectionName,
                applicationId: userData.applicationId || userData.app_id || userData.appId || null,
                lastSeen: sensorData.timestamp,
                status: 'online',
                latestData: sensorData,
                configured: true,
                createdAt: device.created_at
              };
            } else {
              logger.warn(MODULE, `Device ${deviceId} has no sensor data (offline)`);
              return {
                id: device.id,
                deviceId: deviceId,
                name: deviceId,
                type: device.type,
                collectionName: collectionName,
                applicationId: userData.applicationId || userData.app_id || userData.appId || null,
                lastSeen: null,
                status: 'offline',
                latestData: null,
                configured: true,
                createdAt: device.created_at
              };
            }
          } catch (error) {
            logger.error(MODULE, `Error enriching device ${device.name}:`, error);
            return {
              id: device.id,
              deviceId: device.name,
              name: device.name,
              type: device.type,
              collectionName: `sensor-data-${device.name}`,
              status: 'error',
              configured: true
            };
          }
        })
      );
      
      logger.info(MODULE, `Retrieved ${enrichedDevices.length} IoT devices from user configuration`);
      
      return enrichedDevices;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching available devices from user profile:', error);
      return [];
    }
  }

  // Get user's App ID from their profile
  static async getUserAppId(userId) {
    try {
      logger.debug(MODULE, 'Getting Application ID for user:', userId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return null;
      }
      
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const appId = userData.applicationId || userData.app_id || userData.appId;
        logger.success(MODULE, `Found Application ID for user ${userId}:`, appId);
        return appId;
      }
      
      logger.warn(MODULE, 'User not found or has no Application ID');
      return null;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching user Application ID:', error);
      return null;
    }
  }

  // Get SmartBins from Firestore - USER-BASED
  static async getSmartBins(userId = null) {
    try {
      logger.debug(MODULE, 'Getting SmartBins from Firestore...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const smartBinsCollection = collection(db, 'smart-bins');
      
      // If userId is provided, filter by userId
      let smartBinsQuery;
      if (userId) {
        smartBinsQuery = firestoreQuery(
          smartBinsCollection,
          where('userId', '==', userId)
        );
      } else {
        smartBinsQuery = smartBinsCollection;
      }
      
      const smartBinsSnapshot = await getDocs(smartBinsQuery);
      
      if (!smartBinsSnapshot.empty) {
        const smartBins = smartBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${smartBins.length} SmartBins for user ${userId || 'all'}`);
        return smartBins;
      }
      
      logger.debug(MODULE, 'No SmartBins found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching SmartBins:', error);
      return [];
    }
  }

  // Get SingleBins from Firestore - USER-BASED
  static async getSingleBins(userId = null) {
    try {
      logger.debug(MODULE, 'Getting SingleBins from Firestore...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const singleBinsCollection = collection(db, 'single-bins');
      
      // If userId is provided, filter by userId
      let singleBinsQuery;
      if (userId) {
        singleBinsQuery = firestoreQuery(
          singleBinsCollection,
          where('userId', '==', userId)
        );
      } else {
        singleBinsQuery = singleBinsCollection;
      }
      
      const singleBinsSnapshot = await getDocs(singleBinsQuery);
      
      if (!singleBinsSnapshot.empty) {
        const singleBins = singleBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${singleBins.length} SingleBins for user ${userId || 'all'}`);
        return singleBins;
      }
      
      logger.debug(MODULE, 'No SingleBins found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching SingleBins:', error);
      return [];
    }
  }

  // Get SingleBins with enriched sensor data from linked IoT devices - USER-BASED
  static async getSingleBinsWithSensorData(userId = null) {
    try {
      logger.debug(MODULE, 'Getting SingleBins with enriched sensor data...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const singleBins = await this.getSingleBins(userId);
      
      if (singleBins.length === 0) {
        return [];
      }
      
      // Get user's configured IoT devices to map device IDs to names
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      const userData = userSnapshot.exists() ? userSnapshot.data() : null;
      const configuredDevices = userData?.iot_devices || [];
      
      // Create a map of device ID to device name for quick lookup
      const deviceIdToNameMap = new Map();
      configuredDevices.forEach(device => {
        if (device.id && device.name) {
          deviceIdToNameMap.set(device.id, device.name);
          deviceIdToNameMap.set(String(device.id), device.name);
        }
      });
      
      const enrichedSingleBins = await Promise.all(
        singleBins.map(async (singleBin) => {
          try {
            const deviceId = singleBin.iot_device_id || singleBin.device_id || singleBin.deviceId;
            
            if (!deviceId) {
              logger.trace(MODULE, `SingleBin ${singleBin.id} has no linked IoT device`);
              return singleBin;
            }
            
            // Resolve device ID to device name
            const deviceName = deviceIdToNameMap.get(deviceId) || deviceIdToNameMap.get(String(deviceId)) || deviceId;
            
            const sensorData = await this.getLatestSensorData(deviceId, userId);
            
            if (!sensorData) {
              logger.trace(MODULE, `No sensor data found for device ${deviceId}`);
              return {
                ...singleBin,
                deviceName: deviceName, // Add device name even if no sensor data
              };
            }
            
            const enrichedBin = {
              ...singleBin,
              deviceName: deviceName, // ✅ Add device name for display
              sensorValue: sensorData.distance,
              sensor_value: sensorData.distance,
              distance: sensorData.distance,
              fill_level: sensorData.fillLevel,
              current_fill: sensorData.fillLevel,
              battery_level: sensorData.battery,
              temperature: sensorData.temperature,
              humidity: sensorData.humidity,
              air_quality: sensorData.raw?.uplink_message?.decoded_payload?.air_quality || 
                          sensorData.raw?.decoded_payload?.air_quality,
              odour_level: sensorData.raw?.uplink_message?.decoded_payload?.odour_level || 
                          sensorData.raw?.decoded_payload?.odour_level,
              tilt_status: sensorData.tilt,
              last_sensor_update: sensorData.timestamp,
              sensor_data_available: true
            };
            
            logger.success(MODULE, `Enriched SingleBin ${singleBin.id} with sensor data and device name: ${deviceName}`);
            return enrichedBin;
            
          } catch (error) {
            logger.error(MODULE, `Error enriching SingleBin ${singleBin.id}:`, error);
            return singleBin;
          }
        })
      );
      
      logger.info(MODULE, `Enriched ${enrichedSingleBins.length} SingleBins with sensor data`);
      return enrichedSingleBins;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching SingleBins with sensor data:', error);
      return [];
    }
  }

  // Get Compartments from Firestore - USER-BASED
  static async getCompartments(userId = null) {
    try {
      logger.debug(MODULE, 'Getting Compartments from Firestore...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const compartmentsCollection = collection(db, 'compartments');
      
      // If userId is provided, filter by userId
      let compartmentsQuery;
      if (userId) {
        compartmentsQuery = firestoreQuery(
          compartmentsCollection,
          where('userId', '==', userId)
        );
      } else {
        compartmentsQuery = compartmentsCollection;
      }
      
      const compartmentsSnapshot = await getDocs(compartmentsQuery);
      
      if (!compartmentsSnapshot.empty) {
        const compartments = compartmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${compartments.length} Compartments for user ${userId || 'all'}`);
        return compartments;
      }
      
      logger.debug(MODULE, 'No Compartments found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching Compartments:', error);
      return [];
    }
  }

  // ✅ NEW: Get Compartments with enriched sensor data from linked IoT devices - USER-BASED
  static async getCompartmentsWithSensorData(userId = null) {
    try {
      logger.debug(MODULE, 'Getting Compartments with enriched sensor data...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const compartments = await this.getCompartments(userId);
      
      if (compartments.length === 0) {
        return [];
      }
      
      const enrichedCompartments = await Promise.all(
        compartments.map(async (compartment) => {
          try {
            const deviceId = compartment.iot_device_id || compartment.device_id || compartment.deviceId;
            
            if (!deviceId) {
              logger.trace(MODULE, `Compartment ${compartment.id} has no linked IoT device`);
              return compartment;
            }
            
            const sensorData = await this.getLatestSensorData(deviceId);
            
            if (!sensorData) {
              logger.trace(MODULE, `No sensor data found for device ${deviceId}`);
              return compartment;
            }
            
            const enrichedCompartment = {
              ...compartment,
              sensorValue: sensorData.distance,
              sensor_value: sensorData.distance,
              distance: sensorData.distance,
              fill_level: sensorData.fillLevel,
              current_fill: sensorData.fillLevel,
              battery_level: sensorData.battery,
              temperature: sensorData.temperature,
              humidity: sensorData.humidity,
              air_quality: sensorData.raw?.uplink_message?.decoded_payload?.air_quality || 
                          sensorData.raw?.decoded_payload?.air_quality,
              odour_level: sensorData.raw?.uplink_message?.decoded_payload?.odour_level || 
                          sensorData.raw?.decoded_payload?.odour_level,
              tilt_status: sensorData.tilt,
              last_sensor_update: sensorData.timestamp,
              sensor_data_available: true
            };
            
            logger.success(MODULE, `Enriched Compartment ${compartment.id} with sensor data`);
            return enrichedCompartment;
            
          } catch (error) {
            logger.error(MODULE, `Error enriching Compartment ${compartment.id}:`, error);
            return compartment;
          }
        })
      );
      
      logger.info(MODULE, `Enriched ${enrichedCompartments.length} Compartments with sensor data`);
      return enrichedCompartments;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching Compartments with sensor data:', error);
      return [];
    }
  }

  // Get Alerts from Firestore - USER-BASED
  static async getAlerts(userId = null) {
    try {
      logger.debug(MODULE, 'Getting Alerts from Firestore...', { userId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const alertsCollection = collection(db, 'alerts');
      
      // Build query based on userId
      let alertsQuery;
      if (userId) {
        try {
          alertsQuery = firestoreQuery(
            alertsCollection,
            where('userId', '==', userId),
            orderBy('created_at', 'desc'),
            limit(50)
          );
        } catch (orderByError) {
          // Fallback without orderBy if index is missing
          alertsQuery = firestoreQuery(
            alertsCollection,
            where('userId', '==', userId),
            limit(50)
          );
        }
      } else {
        try {
          alertsQuery = firestoreQuery(
            alertsCollection,
            orderBy('created_at', 'desc'),
            limit(50)
          );
        } catch (orderByError) {
          alertsQuery = firestoreQuery(alertsCollection, limit(50));
        }
      }
      
      const alertsSnapshot = await getDocs(alertsQuery);
      
      if (!alertsSnapshot.empty) {
        const alerts = alertsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${alerts.length} Alerts for user ${userId || 'all'}`);
        return alerts;
      }
      
      logger.debug(MODULE, 'No Alerts found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching Alerts:', error);
      
      if (error.code === 'failed-precondition') {
        logger.debug(MODULE, 'Retrying without orderBy...');
        try {
          const alertsCollection = collection(db, 'alerts');
          let simpleQuery;
          
          if (userId) {
            simpleQuery = firestoreQuery(
              alertsCollection,
              where('userId', '==', userId),
              limit(50)
            );
          } else {
            simpleQuery = firestoreQuery(alertsCollection, limit(50));
          }
          
          const alertsSnapshot = await getDocs(simpleQuery);
          
          if (!alertsSnapshot.empty) {
            const alerts = alertsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            logger.info(MODULE, `Retrieved ${alerts.length} Alerts (without ordering)`);
            return alerts;
          }
        } catch (retryError) {
          logger.error(MODULE, 'Retry failed:', retryError);
        }
      }
      
      return [];
    }
  }

  // Save Alert to Firestore - USER-BASED
  static async saveAlert(alertData, userId = null) {
    try {
      logger.debug(MODULE, 'Saving Alert to Firestore:', alertData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      const alertId = alertData.id || `alert-${Date.now()}`;
      const alertRef = doc(db, 'alerts', alertId);
      
      const dataToSave = {
        ...alertData,
        id: alertId,
        userId: alertData.userId || userId || null,
        updated_at: new Date().toISOString(),
        created_at: alertData.created_at || new Date().toISOString()
      };
      
      await setDoc(alertRef, dataToSave, { merge: true });
      
      logger.info(MODULE, `Alert saved: ${alertId}`);
      return { id: alertId, ...dataToSave };
      
    } catch (error) {
      logger.error(MODULE, 'Error saving Alert:', error);
      throw error;
    }
  }

  // Update Alert in Firestore
  static async updateAlert(alertId, updateData) {
    try {
      logger.debug(MODULE, 'Updating Alert:', alertId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      const alertRef = doc(db, 'alerts', alertId);
      
      const dataToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(alertRef, dataToUpdate);
      
      logger.success(MODULE, `Alert updated: ${alertId}`);
      return { id: alertId, ...dataToUpdate };
      
    } catch (error) {
      logger.error(MODULE, 'Error updating Alert:', error);
      throw error;
    }
  }

  // ✅ Acknowledge Alert - marks alert as acknowledged by user
  static async acknowledgeAlert(alertId, acknowledgedBy = 'user') {
    try {
      logger.debug(MODULE, 'Acknowledging Alert:', alertId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      const alertRef = doc(db, 'alerts', alertId);
      
      const updateData = {
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: acknowledgedBy,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(alertRef, updateData);
      
      logger.success(MODULE, `✅ Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
      return { id: alertId, ...updateData };
      
    } catch (error) {
      logger.error(MODULE, 'Error acknowledging Alert:', error);
      throw error;
    }
  }

  // Delete Alert from Firestore
  static async deleteAlert(alertId) {
    try {
      logger.debug(MODULE, 'Deleting Alert:', alertId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      const alertRef = doc(db, 'alerts', alertId);
      await deleteDoc(alertRef);
      
      logger.info(MODULE, `Alert deleted: ${alertId}`);
      
    } catch (error) {
      logger.error(MODULE, 'Error deleting Alert:', error);
      throw error;
    }
  }

  // Subscribe to real-time sensor data updates
  static async subscribeToSensorData(deviceIdOrName, callback, userId = null) {
    logger.debug(MODULE, `Subscribing to real-time updates for device: ${deviceIdOrName}`);
    
    if (!db) {
      logger.error(MODULE, 'Firestore is not initialized');
      return null;
    }
    
    try {
      // Resolve device ID to device name if needed
      const deviceName = await this.getDeviceNameById(deviceIdOrName, userId);
      const deviceCollection = `sensor-data-${deviceName}`;
      
      const deviceCollectionRef = collection(db, deviceCollection);
      const deviceQuery = firestoreQuery(
        deviceCollectionRef,
        orderBy('receivedAt', 'desc'),
        limit(1)
      );
      
      logger.trace(MODULE, `Setting up real-time listener on: ${deviceCollection}`);
      
      const unsubscribe = onSnapshot(
        deviceQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const sensorData = snapshot.docs.map(doc => {
              const data = doc.data();
              return this.formatSensorData(data);
            });
            logger.trace(MODULE, `Real-time update received: ${sensorData.length} record(s)`);
            callback(sensorData);
          } else {
            logger.trace(MODULE, 'Real-time update: No data in snapshot');
            callback([]);
          }
        },
        (error) => {
          logger.error(MODULE, 'Real-time subscription error:', error);
          
          if (error.code === 'failed-precondition') {
            logger.debug(MODULE, 'Firestore index required. Retrying without orderBy...');
            
            const simpleQuery = firestoreQuery(deviceCollectionRef, limit(1));
            return onSnapshot(simpleQuery, 
              (snapshot) => {
                if (!snapshot.empty) {
                  const sensorData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return this.formatSensorData(data);
                  });
                  callback(sensorData);
                }
              },
              (err) => logger.error(MODULE, 'Retry subscription error:', err)
            );
          }
        }
      );
      
      logger.success(MODULE, `Real-time subscription established for ${deviceCollection}`);
      return unsubscribe;
      
    } catch (error) {
      logger.error(MODULE, 'Error setting up real-time subscription:', error);
      return null;
    }
  }

  // Get historical sensor data
  static async getHistoricalData(deviceIdOrName, limitCount = 100, userId = null) {
    logger.debug(MODULE, `Getting historical data for device: ${deviceIdOrName}`, { limit: limitCount });
    
    try {
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      // Resolve device ID to device name if needed
      const deviceName = await this.getDeviceNameById(deviceIdOrName, userId);
      const deviceCollection = `sensor-data-${deviceName}`;
      
      const deviceCollectionRef = collection(db, deviceCollection);
      const deviceQuery = firestoreQuery(
        deviceCollectionRef,
        orderBy('receivedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(deviceQuery);
      
      if (!snapshot.empty) {
        const historicalData = snapshot.docs.map(doc => {
          const data = doc.data();
          return this.formatSensorData(data);
        });
        logger.info(MODULE, `Retrieved ${historicalData.length} historical records from ${deviceCollection}`);
        return historicalData;
      }
      
      logger.debug(MODULE, `No historical data found in ${deviceCollection}`);
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching historical data:', error);
      
      if (error.code === 'failed-precondition') {
        logger.debug(MODULE, 'Retrying without orderBy...');
        try {
          const deviceName = await this.getDeviceNameById(deviceIdOrName, userId);
          const deviceCollection = `sensor-data-${deviceName}`;
          const deviceCollectionRef = collection(db, deviceCollection);
          const simpleQuery = firestoreQuery(deviceCollectionRef, limit(limitCount));
          
          const snapshot = await getDocs(simpleQuery);
          
          if (!snapshot.empty) {
            const historicalData = snapshot.docs.map(doc => {
              const data = doc.data();
              return this.formatSensorData(data);
            });
            logger.info(MODULE, `Retrieved ${historicalData.length} historical records (unordered)`);
            return historicalData;
          }
        } catch (retryError) {
          logger.error(MODULE, 'Retry failed:', retryError);
        }
      }
      
      return [];
    }
  }

  // Format sensor data to consistent structure
  static formatSensorData(data) {
    logger.trace(MODULE, 'Formatting sensor data');
    
    const sensorData = data.sensorData || null;
    const uplink = data.uplink_message || data.uplinkMessage || data;
    const decoded = uplink.decoded_payload || uplink.decodedPayload || data.decoded_payload || uplink || data;
    
    const deviceId = data.end_device_ids?.device_id || 
                     data.deviceId || 
                     data.device_id ||
                     decoded.deviceId ||
                     decoded.device_id ||
                     'unknown';
    
    const timestamp = data.received_at || 
                     data.receivedAt || 
                     data.timestamp ||
                     decoded.timestamp ||
                     new Date().toISOString();
    
    const distance = sensorData?.distance ||
                    decoded.distance ||
                    decoded.Distance || 
                    decoded.dist ||
                    data.distance ||
                    data.Distance ||
                    null;
    
    let fillLevel = sensorData?.fillLevel ||
                    sensorData?.fill_level ||
                    decoded.fillLevel || 
                    decoded.FillLevel || 
                    decoded.fill_level ||
                    decoded.fill ||
                    data.fillLevel ||
                    data.FillLevel ||
                    data.fill_level ||
                    null;
    
    if (fillLevel === null && distance !== null) {
      fillLevel = distance;
      logger.trace(MODULE, `Mapped distance (${distance}) to fillLevel`);
    }
    
    const battery = sensorData?.battery ||
                   decoded.battery ||
                   decoded.Battery || 
                   decoded.bat ||
                   decoded.batt ||
                   data.battery ||
                   data.Battery ||
                   null;
    
    const temperature = sensorData?.temperature ||
                       decoded.temperature || 
                       decoded.Temperature || 
                       decoded.temp ||
                       decoded.Temp ||
                       data.temperature ||
                       data.Temperature ||
                       null;
    
    const humidity = sensorData?.humidity ||
                    decoded.humidity || 
                    decoded.Humidity || 
                    decoded.hum ||
                    data.humidity ||
                    data.Humidity ||
                    null;
    
    const tilt = sensorData?.tilt ||
                decoded.tilt || 
                decoded.Tilt || 
                data.tilt ||
                'normal';
    
    const formattedData = {
      deviceId,
      timestamp,
      distance,
      fillLevel,
      battery,
      tilt,
      temperature,
      humidity,
      raw: data
    };
    
    logger.trace(MODULE, 'Formatted sensor data:', { 
      deviceId, 
      distance, 
      fillLevel, 
      battery, 
      tilt 
    });
    
    if (distance === null && fillLevel === null && battery === null) {
      logger.warn(MODULE, 'Warning: No distance, fillLevel, or battery found in sensor data');
    }
    
    return formattedData;
  }

  // ✅ NEW: Monitor bins and automatically create alerts when thresholds are exceeded
  static async monitorBinsAndCreateAlerts(singleBins, compartments, calculateFillLevel) {
    logger.debug(MODULE, 'Monitoring bins for threshold violations...');
    
    const newAlerts = [];
    
    try {
      // Get existing alerts to check acknowledgment state
      const existingAlerts = await this.getAlerts();
      
      // Helper to check if there's an unacknowledged alert at ANY severity for this bin
      const hasAnyUnacknowledgedAlert = (binId, alertType) => {
        return existingAlerts.some(alert => 
          (alert.bin_id === binId || alert.compartment_id === binId) &&
          alert.alert_type === alertType &&
          alert.status === 'active' &&
          !alert.acknowledged
        );
      };

      // Helper to get the highest existing severity level for a bin
      const getHighestExistingSeverity = (binId, alertType) => {
        const severityOrder = { 'medium': 1, 'high': 2, 'critical': 3 };
        const binAlerts = existingAlerts.filter(alert => 
          (alert.bin_id === binId || alert.compartment_id === binId) &&
          alert.alert_type === alertType &&
          alert.status === 'active'
        );
        
        if (binAlerts.length === 0) return null;
        
        let highest = null;
        let highestValue = 0;
        
        for (const alert of binAlerts) {
          const value = severityOrder[alert.severity] || 0;
          if (value > highestValue) {
            highestValue = value;
            highest = alert.severity;
          }
        }
        
        return highest;
      };

      // Helper to check if alert was recently acknowledged (reduced to 5 minutes for faster iteration)
      const wasRecentlyAcknowledged = (binId, alertType, severity) => {
        return existingAlerts.some(alert =>
          (alert.bin_id === binId || alert.compartment_id === binId) &&
          alert.alert_type === alertType &&
          alert.severity === severity &&
          alert.status === 'active' &&
          alert.acknowledged &&
          alert.acknowledgedAt &&
          new Date(alert.acknowledgedAt) > new Date(Date.now() - 5 * 60 * 1000) // 5 minutes cooldown
        );
      };

      // Monitor SingleBins
      for (const bin of singleBins) {
        try {
          const binHeight = bin.bin_height || bin.height || 100;
          const sensorValue = bin.sensorValue || bin.sensor_value || bin.distance;
          const threshold = bin.fill_threshold || 90;
          
          if (!sensorValue || !binHeight) {
            logger.trace(MODULE, `Skipping bin ${bin.id} - missing sensor data`);
            continue;
          }
          
          const fillPercentage = calculateFillLevel(sensorValue, binHeight);
          
          logger.trace(MODULE, `Checking bin ${bin.name}: ${fillPercentage}% (threshold: ${threshold}%)`);
          
          // Determine current severity level based on fill percentage
          let currentSeverity = null;
          if (fillPercentage >= 95) {
            currentSeverity = 'critical';
          } else if (fillPercentage >= threshold) {
            currentSeverity = 'high';
          } else if (fillPercentage >= threshold - 5) {
            currentSeverity = 'medium';
          }
          
          // If no threshold violation, skip
          if (!currentSeverity) {
            continue;
          }
          
          // Get the highest existing alert severity
          const highestExisting = getHighestExistingSeverity(bin.id, 'fill_level');
          const severityOrder = { 'medium': 1, 'high': 2, 'critical': 3 };
          const currentSeverityValue = severityOrder[currentSeverity] || 0;
          const existingSeverityValue = highestExisting ? severityOrder[highestExisting] : 0;
          
          // ESCALATION CASE: Current severity is higher than existing - always create alert
          if (currentSeverityValue > existingSeverityValue) {
            logger.info(MODULE, `🔺 Escalating alert for ${bin.name}: ${highestExisting || 'none'} → ${currentSeverity}`);
            
            // Auto-resolve all lower severity alerts
            if (currentSeverity === 'critical') {
              await this.autoResolveAlertsForBin(bin.id, ['high', 'medium']);
            } else if (currentSeverity === 'high') {
              await this.autoResolveAlertsForBin(bin.id, ['medium']);
            }
            
            // Create escalation alert
            const alert = {
              id: `alert-${bin.id}-fill-${currentSeverity}-${Date.now()}`,
              bin_id: bin.id,
              binName: bin.name || `Bin ${bin.id}`,
              binType: 'SingleBin',
              alert_type: 'fill_level',
              severity: currentSeverity,
              message: `⚠️ ESCALATED: ${bin.name || 'Bin'} has reached ${fillPercentage}% capacity`,
              currentValue: fillPercentage,
              threshold: threshold,
              unit: '%',
              status: 'active',
              acknowledged: false,
              acknowledgedAt: null,
              acknowledgedBy: null,
              location: bin.location || 'Unknown',
              created_at: new Date().toISOString(),
              timestamp: new Date().toISOString()
            };
            
            await this.saveAlert(alert);
            newAlerts.push(alert);
            
            logger.success(MODULE, `🚨 Created escalation alert: ${bin.name} → ${currentSeverity} (${fillPercentage}%)`);
            continue;
          }
          
          // SAME SEVERITY CASE: Check if we should create a new alert at the same level
          if (currentSeverityValue === existingSeverityValue) {
            // Check if there's an unacknowledged alert at this level
            const hasUnacknowledged = hasAnyUnacknowledgedAlert(bin.id, 'fill_level');
            
            if (hasUnacknowledged) {
              logger.trace(MODULE, `Suppressing ${currentSeverity} alert for ${bin.name} - unacknowledged alert exists`);
              continue;
            }
            
            // Check if recently acknowledged (5-minute cooldown)
            const recentlyAcknowledged = wasRecentlyAcknowledged(bin.id, 'fill_level', currentSeverity);
            
            if (recentlyAcknowledged) {
              logger.trace(MODULE, `Suppressing ${currentSeverity} alert for ${bin.name} - recently acknowledged (5 min cooldown)`);
              continue;
            }
            
            // All checks passed - create reminder alert
            logger.info(MODULE, `🔔 Creating reminder alert for ${bin.name} at ${currentSeverity} level`);
          }
          
          // NEW ALERT CASE: No existing alerts, create first alert
          if (!highestExisting) {
            logger.info(MODULE, `🆕 Creating initial ${currentSeverity} alert for ${bin.name}`);
          }
          
          // Create the alert
          const alert = {
            id: `alert-${bin.id}-fill-${currentSeverity}-${Date.now()}`,
            bin_id: bin.id,
            binName: bin.name || `Bin ${bin.id}`,
            binType: 'SingleBin',
            alert_type: 'fill_level',
            severity: currentSeverity,
            message: `${bin.name || 'Bin'} has reached ${fillPercentage}% capacity`,
            currentValue: fillPercentage,
            threshold: threshold,
            unit: '%',
            status: 'active',
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            location: bin.location || 'Unknown',
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString()
          };
          
          await this.saveAlert(alert);
          newAlerts.push(alert);
          
          logger.success(MODULE, `🚨 Created ${currentSeverity} alert for ${bin.name} (${fillPercentage}%)`);
          
        } catch (error) {
          logger.error(MODULE, `Error monitoring bin ${bin.id}:`, error);
        }
      }
      
      // Monitor Compartments (same logic as SingleBins)
      for (const compartment of compartments) {
        try {
          const binHeight = compartment.bin_height || compartment.height || 100;
          const sensorValue = compartment.sensorValue || compartment.sensor_value || compartment.distance;
          const threshold = compartment.fill_threshold || 90;
          
          if (!sensorValue || !binHeight) {
            logger.trace(MODULE, `Skipping compartment ${compartment.id} - missing sensor data`);
            continue;
          }
          
          const fillPercentage = calculateFillLevel(sensorValue, binHeight);
          
          logger.trace(MODULE, `Checking compartment ${compartment.label}: ${fillPercentage}% (threshold: ${threshold}%)`);
          
          // Determine current severity level
          let currentSeverity = null;
          if (fillPercentage >= 95) {
            currentSeverity = 'critical';
          } else if (fillPercentage >= threshold) {
            currentSeverity = 'high';
          } else if (fillPercentage >= threshold - 5) {
            currentSeverity = 'medium';
          }
          
          if (!currentSeverity) {
            continue;
          }
          
          const highestExisting = getHighestExistingSeverity(compartment.id, 'fill_level');
          const severityOrder = { 'medium': 1, 'high': 2, 'critical': 3 };
          const currentSeverityValue = severityOrder[currentSeverity] || 0;
          const existingSeverityValue = highestExisting ? severityOrder[highestExisting] : 0;
          
          // ESCALATION CASE
          if (currentSeverityValue > existingSeverityValue) {
            logger.info(MODULE, `🔺 Escalating alert for ${compartment.label}: ${highestExisting || 'none'} → ${currentSeverity}`);
            
            if (currentSeverity === 'critical') {
              await this.autoResolveAlertsForBin(compartment.id, ['high', 'medium']);
            } else if (currentSeverity === 'high') {
              await this.autoResolveAlertsForBin(compartment.id, ['medium']);
            }
            
            const alert = {
              id: `alert-${compartment.id}-fill-${currentSeverity}-${Date.now()}`,
              compartment_id: compartment.id,
              binName: compartment.label || `Compartment ${compartment.id}`,
              binType: 'Compartment',
              alert_type: 'fill_level',
              severity: currentSeverity,
              message: `⚠️ ESCALATED: ${compartment.label || 'Compartment'} has reached ${fillPercentage}% capacity`,
              currentValue: fillPercentage,
              threshold: threshold,
              unit: '%',
              status: 'active',
              acknowledged: false,
              acknowledgedAt: null,
              acknowledgedBy: null,
              location: compartment.location || 'Unknown',
              created_at: new Date().toISOString(),
              timestamp: new Date().toISOString()
            };
            
            await this.saveAlert(alert);
            newAlerts.push(alert);
            
            logger.success(MODULE, `🚨 Created escalation alert: ${compartment.label} → ${currentSeverity} (${fillPercentage}%)`);
            continue;
          }
          
          // SAME SEVERITY CASE
          if (currentSeverityValue === existingSeverityValue) {
            const hasUnacknowledged = hasAnyUnacknowledgedAlert(compartment.id, 'fill_level');
            
            if (hasUnacknowledged) {
              logger.trace(MODULE, `Suppressing ${currentSeverity} alert for ${compartment.label} - unacknowledged alert exists`);
              continue;
            }
            
            const recentlyAcknowledged = wasRecentlyAcknowledged(compartment.id, 'fill_level', currentSeverity);
            
            if (recentlyAcknowledged) {
              logger.trace(MODULE, `Suppressing ${currentSeverity} alert for ${compartment.label} - recently acknowledged (5 min cooldown)`);
              continue;
            }
            
            logger.info(MODULE, `🔔 Creating reminder alert for ${compartment.label} at ${currentSeverity} level`);
          }
          
          // NEW ALERT CASE
          if (!highestExisting) {
            logger.info(MODULE, `🆕 Creating initial ${currentSeverity} alert for ${compartment.label}`);
          }
          
          const alert = {
            id: `alert-${compartment.id}-fill-${currentSeverity}-${Date.now()}`,
            compartment_id: compartment.id,
            binName: compartment.label || `Compartment ${compartment.id}`,
            binType: 'Compartment',
            alert_type: 'fill_level',
            severity: currentSeverity,
            message: `${compartment.label || 'Compartment'} has reached ${fillPercentage}% capacity`,
            currentValue: fillPercentage,
            threshold: threshold,
            unit: '%',
            status: 'active',
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            location: compartment.location || 'Unknown',
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString()
          };
          
          await this.saveAlert(alert);
          newAlerts.push(alert);
          
          logger.success(MODULE, `🚨 Created ${currentSeverity} alert for ${compartment.label} (${fillPercentage}%)`);
          
        } catch (error) {
          logger.error(MODULE, `Error monitoring compartment ${compartment.id}:`, error);
        }
      }
      
      if (newAlerts.length > 0) {
        logger.success(MODULE, `✅ Created ${newAlerts.length} new alert(s)`);
      } else {
        logger.trace(MODULE, 'No new alerts needed');
      }
      
      return newAlerts;
      
    } catch (error) {
      logger.error(MODULE, 'Error in alert monitoring:', error);
      return [];
    }
  }

  // ✅ NEW: Auto-resolve alerts that are no longer relevant
  static async autoResolveAlerts(singleBins, compartments, calculateFillLevel) {
    logger.debug(MODULE, 'Checking for alerts to auto-resolve...');
    
    try {
      const existingAlerts = await this.getAlerts();
      const activeAlerts = existingAlerts.filter(alert => alert.status === 'active');
      
      let resolvedCount = 0;
      
      for (const alert of activeAlerts) {
        try {
          // Find the bin/compartment for this alert
          let bin = null;
          let fillPercentage = 0;
          
          if (alert.bin_id) {
            bin = singleBins.find(b => b.id === alert.bin_id);
            if (bin) {
              const binHeight = bin.bin_height || bin.height || 100;
              const sensorValue = bin.sensorValue || bin.sensor_value || bin.distance;
              if (sensorValue && binHeight) {
                fillPercentage = calculateFillLevel(sensorValue, binHeight);
              }
            }
          } else if (alert.compartment_id) {
            bin = compartments.find(c => c.id === alert.compartment_id);
            if (bin) {
              const binHeight = bin.bin_height || bin.height || 100;
              const sensorValue = bin.sensorValue || bin.sensor_value || bin.distance;
              if (sensorValue && binHeight) {
                fillPercentage = calculateFillLevel(sensorValue, binHeight);
              }
            }
          }
          
          if (!bin) {
            logger.trace(MODULE, `Bin not found for alert ${alert.id}, skipping`);
            continue;
          }
          
          // Auto-resolve if fill level has dropped below threshold - 10%
          const threshold = bin.fill_threshold || 90;
          const resolveThreshold = threshold - 10;
          
          if (fillPercentage < resolveThreshold) {
            await this.updateAlert(alert.id, {
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              resolution_type: 'auto',
              resolution_note: `Fill level dropped to ${fillPercentage}% (below ${resolveThreshold}%)`
            });
            
            resolvedCount++;
            logger.info(MODULE, `✅ Auto-resolved alert for ${alert.binName}: ${fillPercentage}% < ${resolveThreshold}%`);
          }
          
        } catch (error) {
          logger.error(MODULE, `Error auto-resolving alert ${alert.id}:`, error);
        }
      }
      
      if (resolvedCount > 0) {
        logger.success(MODULE, `✅ Auto-resolved ${resolvedCount} alert(s)`);
      } else {
        logger.trace(MODULE, 'No alerts needed auto-resolution');
      }
      
    } catch (error) {
      logger.error(MODULE, 'Error in auto-resolve alerts:', error);
    }
  }

  // ✅ Helper: Auto-resolve specific severity alerts for a bin (used when upgrading alert severity)
  static async autoResolveAlertsForBin(binId, severities) {
    logger.debug(MODULE, `Auto-resolving ${severities.join(', ')} alerts for bin ${binId}`);
    
    try {
      const existingAlerts = await this.getAlerts();
      
      for (const alert of existingAlerts) {
        if (
          (alert.bin_id === binId || alert.compartment_id === binId) &&
          alert.status === 'active' &&
          severities.includes(alert.severity)
        ) {
          await this.updateAlert(alert.id, {
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_type: 'auto',
            resolution_note: 'Alert severity upgraded to higher level'
          });
          
          logger.success(MODULE, `✅ Auto-resolved ${alert.severity} alert (upgraded to critical): ${alert.id}`);
        }
      }
    } catch (error) {
      logger.error(MODULE, 'Error auto-resolving alerts for bin:', error);
    }
  }

  // ✅ Save SmartBin to Firestore - USER-BASED
  static async saveSmartBin(smartBinData, userId = null) {
    try {
      logger.debug(MODULE, 'Saving SmartBin to Firestore:', smartBinData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      // Generate ID if not provided
      const binId = smartBinData.id || `smart-bin-${Date.now()}`;
      
      // Extract compartments if they exist
      const compartments = smartBinData.compartments || [];
      
      // Prepare SmartBin data with userId
      const smartBinPayload = {
        ...smartBinData,
        id: binId,
        userId: smartBinData.userId || userId || null,
        updated_at: new Date().toISOString(),
        created_at: smartBinData.created_at || new Date().toISOString()
      };
      
      // Save SmartBin to Firestore
      const binRef = doc(db, 'smart-bins', binId);
      await setDoc(binRef, smartBinPayload, { merge: true });
      
      logger.success(MODULE, `SmartBin saved successfully: ${binId} for user ${userId}`);
      
      // If compartments are included, save them separately to the compartments collection
      if (compartments.length > 0) {
        logger.debug(MODULE, `Saving ${compartments.length} compartments to compartments collection...`);
        
        const compartmentSavePromises = compartments.map(async (comp) => {
          // Generate compartment ID if needed (or update existing)
          const compartmentId = (comp.id && !comp.id.startsWith('temp_')) 
            ? comp.id 
            : `compartment-${binId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const compartmentPayload = {
            ...comp,
            id: compartmentId,
            smartBinId: binId,
            smartbin_id: binId,
            userId: smartBinData.userId || userId || null,
            updated_at: new Date().toISOString(),
            created_at: comp.created_at || new Date().toISOString(),
            created_by: smartBinData.created_by || 'system'
          };
          
          const compartmentRef = doc(db, 'compartments', compartmentId);
          await setDoc(compartmentRef, compartmentPayload, { merge: true });
          
          logger.trace(MODULE, `Compartment saved: ${compartmentId} (${comp.name})`);
          return compartmentPayload;
        });
        
        const savedCompartments = await Promise.all(compartmentSavePromises);
        logger.success(MODULE, `All ${savedCompartments.length} compartments saved successfully`);
        
        // Return the SmartBin with the saved compartments
        return { 
          ...smartBinPayload, 
          compartments: savedCompartments 
        };
      }
      
      return smartBinPayload;
      
    } catch (error) {
      logger.error(MODULE, 'Error saving SmartBin:', error);
      throw error;
    }
  }

  // ✅ Save SingleBin to Firestore - USER-BASED
  static async saveSingleBin(singleBinData, userId = null) {
    try {
      logger.debug(MODULE, 'Saving SingleBin to Firestore:', singleBinData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      // Generate ID if not provided
      const binId = singleBinData.id || `single-bin-${Date.now()}`;
      const binRef = doc(db, 'single-bins', binId);
      
      // Prepare data with timestamp and userId
      const dataToSave = {
        ...singleBinData,
        id: binId,
        userId: singleBinData.userId || userId || null,
        updated_at: new Date().toISOString(),
        created_at: singleBinData.created_at || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(binRef, dataToSave, { merge: true });
      
      logger.success(MODULE, `SingleBin saved successfully: ${binId} for user ${userId}`);
      return { id: binId, ...dataToSave };
      
    } catch (error) {
      logger.error(MODULE, 'Error saving SingleBin:', error);
      throw error;
    }
  }

  // ✅ Save Compartment to Firestore - USER-BASED
  static async saveCompartment(compartmentData, userId = null) {
    try {
      logger.debug(MODULE, 'Saving Compartment to Firestore:', compartmentData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }

      if (!userId) {
        userId = await getCurrentUserId();
      }
      
      // Generate ID if not provided
      const compartmentId = compartmentData.id || `compartment-${Date.now()}`;
      const compartmentRef = doc(db, 'compartments', compartmentId);
      
      // Prepare data with timestamp and userId
      const dataToSave = {
        ...compartmentData,
        id: compartmentId,
        userId: compartmentData.userId || userId || null,
        updated_at: new Date().toISOString(),
        created_at: compartmentData.created_at || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(compartmentRef, dataToSave, { merge: true });
      
      logger.success(MODULE, `Compartment saved successfully: ${compartmentId} for user ${userId}`);
      return { id: compartmentId, ...dataToSave };
      
    } catch (error) {
      logger.error(MODULE, 'Error saving Compartment:', error);
      throw error;
    }
  }

  // ✅ Delete SmartBin from Firestore
  static async deleteSmartBin(binId) {
    try {
      logger.debug(MODULE, 'Deleting SmartBin from Firestore:', binId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the smart bin document
      const binRef = doc(db, 'smart-bins', binId);
      await deleteDoc(binRef);
      
      // Also delete all compartments associated with this smart bin
      const compartmentsCollection = collection(db, 'compartments');
      const compartmentsQuery = firestoreQuery(
        compartmentsCollection,
        where('smartBinId', '==', binId)
      );
      const compartmentsSnapshot = await getDocs(compartmentsQuery);
      
      // Delete each compartment
      const deletePromises = compartmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      logger.info(MODULE, `SmartBin and ${compartmentsSnapshot.size} compartments deleted successfully`);
      
    } catch (error) {
      logger.error(MODULE, 'Error deleting SmartBin:', error);
      throw error;
    }
  }

  // ✅ Delete SingleBin from Firestore
  static async deleteSingleBin(binId) {
    try {
      logger.debug(MODULE, 'Deleting SingleBin from Firestore:', binId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the single bin document
      const binRef = doc(db, 'single-bins', binId);
      await deleteDoc(binRef);
      
      logger.info(MODULE, 'SingleBin deleted successfully');
      
    } catch (error) {
      logger.error(MODULE, 'Error deleting SingleBin:', error);
      throw error;
    }
  }

  // ✅ Delete Compartment from Firestore
  static async deleteCompartment(compartmentId) {
    try {
      logger.debug(MODULE, 'Deleting Compartment from Firestore:', compartmentId);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the compartment document
      const compartmentRef = doc(db, 'compartments', compartmentId);
      await deleteDoc(compartmentRef);
      
      logger.info(MODULE, 'Compartment deleted successfully');
      
    } catch (error) {
      logger.error(MODULE, 'Error deleting Compartment:', error);
      throw error;
    }
  }

  // ✅ NEW: Clear all alerts from Firestore
  static async clearAllAlerts() {
    try {
      logger.debug(MODULE, 'Clearing all alerts from Firestore...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Get all alerts
      const alertsCollection = collection(db, 'alerts');
      const alertsSnapshot = await getDocs(alertsCollection);
      
      if (alertsSnapshot.empty) {
        logger.info(MODULE, 'No alerts to delete');
        return { deleted: 0, message: 'No alerts found' };
      }
      
      const deleteCount = alertsSnapshot.size;
      logger.info(MODULE, `Found ${deleteCount} alerts to delete`);
      
      // Delete all alert documents in parallel
      const deletePromises = alertsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      logger.success(MODULE, `✅ Successfully deleted all ${deleteCount} alerts from Firestore`);
      
      return { 
        deleted: deleteCount, 
        message: `Successfully deleted ${deleteCount} alert(s)` 
      };
      
    } catch (error) {
      logger.error(MODULE, 'Error clearing all alerts:', error);
      throw error;
    }
  }

  // ✅ NEW: Generate alerts for all bins (called from Alerts page)
  // This function has locking to prevent duplicate alerts from concurrent executions
  static async generateAlertsForBins() {
    // Check if alert generation is already in progress
    if (isGeneratingAlerts) {
      logger.warn(MODULE, '⚠️ Alert generation already in progress, skipping duplicate request');
      return [];
    }

    // Check cooldown period
    const now = Date.now();
    if (lastAlertCheck && (now - lastAlertCheck) < ALERT_CHECK_COOLDOWN) {
      const remainingCooldown = Math.ceil((ALERT_CHECK_COOLDOWN - (now - lastAlertCheck)) / 1000);
      logger.warn(MODULE, `⚠️ Alert check on cooldown, please wait ${remainingCooldown} seconds`);
      return [];
    }

    // Acquire lock
    isGeneratingAlerts = true;
    lastAlertCheck = now;

    try {
      logger.info(MODULE, '🔍 Generating alerts for all bins...');

      // Get all bins and compartments
      const [singleBins, compartments] = await Promise.all([
        this.getSingleBinsWithSensorData(),
        this.getCompartmentsWithSensorData()
      ]);

      if (singleBins.length === 0 && compartments.length === 0) {
        logger.warn(MODULE, 'No bins or compartments found to monitor');
        return [];
      }

      // Helper function to calculate fill level
      const calculateFillLevel = (sensorValue, binHeight) => {
        if (!sensorValue || !binHeight || binHeight === 0) return 0;
        const fillLevel = ((binHeight - sensorValue) / binHeight) * 100;
        return Math.max(0, Math.min(100, Math.round(fillLevel)));
      };

      // Monitor bins and create alerts
      const newAlerts = await this.monitorBinsAndCreateAlerts(
        singleBins,
        compartments,
        calculateFillLevel
      );

      // Auto-resolve alerts that are no longer needed
      await this.autoResolveAlerts(
        singleBins,
        compartments,
        calculateFillLevel
      );

      logger.success(MODULE, `✅ Alert generation complete: ${newAlerts.length} new alert(s) created`);
      return newAlerts;

    } catch (error) {
      logger.error(MODULE, '❌ Error generating alerts:', error);
      throw error;
    } finally {
      // Release lock
      isGeneratingAlerts = false;
    }
  }
}
