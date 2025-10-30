import { database, db } from '../config/firebase';
import { ref, onValue, push, set, get, query, orderByChild, limitToLast, orderByKey, child } from 'firebase/database';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, orderBy, limit, where, query as firestoreQuery } from 'firebase/firestore';

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
        'alerts', 'users', 'all-sensor-data', 'sensor-data-*'
      ];
      
      const foundCollections = [];
      
      for (const pattern of knownPatterns) {
        try {
          if (pattern.includes('*')) {
            const basePattern = pattern.replace('*', '');
            const deviceIds = ['sortyx-sensor-two', 'sortyx-sensor-three', 'sortyx-sensor-four','sortyx-sensor-five','plaese-work'];
            for (const deviceId of deviceIds) {
              const collectionName = `${basePattern}${deviceId}`;
              const testRef = collection(db, collectionName);
              const testSnapshot = await getDocs(firestoreQuery(testRef, limit(1)));
              if (!testSnapshot.empty) {
                foundCollections.push(collectionName);
                logger.trace(MODULE, `Found collection: ${collectionName}`);
              }
            }
          } else {
            const testRef = collection(db, pattern);
            const testSnapshot = await getDocs(firestoreQuery(testRef, limit(1)));
            if (!testSnapshot.empty) {
              foundCollections.push(pattern);
              logger.trace(MODULE, `Found collection: ${pattern}`, { documents: testSnapshot.size });
            }
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

  // Get latest sensor data for a specific device from FIRESTORE - OPTIMIZED
  static async getLatestSensorData(deviceId = 'sortyx-sensor-two') {
    logger.debug(MODULE, `Getting latest sensor data for device: ${deviceId}`);
    
    try {
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return null;
      }
      
      const deviceCollection = `sensor-data-${deviceId}`;
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
            return data.deviceId === deviceId || 
                   data.end_device_ids?.device_id === deviceId ||
                   doc.id.includes(deviceId);
          });
          
          if (deviceDoc) {
            const latestData = deviceDoc.data();
            logger.success(MODULE, `Found data in all-sensor-data for ${deviceId}`);
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
            return data.deviceId === deviceId || 
                   data.end_device_ids?.device_id === deviceId ||
                   doc.id.includes(deviceId);
          });
          
          if (deviceDoc) {
            const latestData = deviceDoc.data();
            logger.success(MODULE, `Found data in all-sensor-data for ${deviceId} (unordered)`);
            return this.formatSensorData(latestData);
          }
        }
      }
      
      logger.warn(MODULE, `No sensor data found for device: ${deviceId}`);
      return null;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching latest sensor data:', error);
      
      if (error.code === 'permission-denied') {
        logger.warn(MODULE, 'Permission denied - check Firestore security rules');
      }
      
      return null;
    }
  }

  // Get available IoT devices filtered by user's App ID
  static async getAvailableDevices(userAppId = null) {
    try {
      logger.debug(MODULE, 'Getting available IoT devices', { appId: userAppId });
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      logger.trace(MODULE, 'Discovering all sensor-data-* collections...');
      
      const allCollections = await this.discoverCollections();
      const sensorDataCollections = allCollections.filter(name => 
        name.startsWith('sensor-data-')
      );
      
      logger.debug(MODULE, `Found ${sensorDataCollections.length} sensor-data-* collections`);
      
      if (sensorDataCollections.length === 0) {
        logger.warn(MODULE, 'No sensor-data-* collections found');
        return [];
      }
      
      const deviceMap = new Map();
      
      for (const collectionName of sensorDataCollections) {
        try {
          logger.trace(MODULE, `Querying collection: ${collectionName}`);
          
          const collectionRef = collection(db, collectionName);
          const q = firestoreQuery(collectionRef, limit(1));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const latestDoc = snapshot.docs[0];
            const data = latestDoc.data();
            
            const deviceId = collectionName.replace('sensor-data-', '') || 
                           data.end_device_ids?.device_id || 
                           data.deviceId;
            
            const appId = data.end_device_ids?.application_ids?.application_id || 
                         data.applicationId || 
                         data.application_id;
            
            if (userAppId && appId && appId !== userAppId) {
              logger.trace(MODULE, `Skipping device ${deviceId} - applicationId mismatch`);
              continue;
            }
            
            const device = {
              id: deviceId,
              deviceId: deviceId,
              collectionName: collectionName,
              applicationId: appId,
              lastSeen: data.received_at || data.receivedAt || new Date().toISOString(),
              status: 'active',
              latestData: this.formatSensorData(data)
            };
            
            if (!deviceMap.has(deviceId)) {
              deviceMap.set(deviceId, device);
              logger.trace(MODULE, `Added device: ${deviceId}`, { appId: appId || 'N/A' });
            }
          }
        } catch (collectionError) {
          logger.debug(MODULE, `Error querying collection ${collectionName}:`, collectionError.message);
        }
      }
      
      const devices = Array.from(deviceMap.values());
      
      logger.info(MODULE, `Retrieved ${devices.length} IoT devices`);
      
      return devices;
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching available devices:', error);
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

  // Get SmartBins from Firestore
  static async getSmartBins() {
    try {
      logger.debug(MODULE, 'Getting SmartBins from Firestore...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const smartBinsCollection = collection(db, 'smart-bins');
      const smartBinsSnapshot = await getDocs(smartBinsCollection);
      
      if (!smartBinsSnapshot.empty) {
        const smartBins = smartBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${smartBins.length} SmartBins`);
        return smartBins;
      }
      
      logger.debug(MODULE, 'No SmartBins found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching SmartBins:', error);
      return [];
    }
  }

  // Get SingleBins from Firestore
  static async getSingleBins() {
    try {
      logger.debug(MODULE, 'Getting SingleBins from Firestore...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const singleBinsCollection = collection(db, 'single-bins');
      const singleBinsSnapshot = await getDocs(singleBinsCollection);
      
      if (!singleBinsSnapshot.empty) {
        const singleBins = singleBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${singleBins.length} SingleBins`);
        return singleBins;
      }
      
      logger.debug(MODULE, 'No SingleBins found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching SingleBins:', error);
      return [];
    }
  }

  // Get SingleBins with enriched sensor data from linked IoT devices
  static async getSingleBinsWithSensorData() {
    try {
      logger.debug(MODULE, 'Getting SingleBins with enriched sensor data...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const singleBins = await this.getSingleBins();
      
      if (singleBins.length === 0) {
        return [];
      }
      
      const enrichedSingleBins = await Promise.all(
        singleBins.map(async (singleBin) => {
          try {
            const deviceId = singleBin.iot_device_id || singleBin.device_id || singleBin.deviceId;
            
            if (!deviceId) {
              logger.trace(MODULE, `SingleBin ${singleBin.id} has no linked IoT device`);
              return singleBin;
            }
            
            const sensorData = await this.getLatestSensorData(deviceId);
            
            if (!sensorData) {
              logger.trace(MODULE, `No sensor data found for device ${deviceId}`);
              return singleBin;
            }
            
            const enrichedBin = {
              ...singleBin,
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
            
            logger.success(MODULE, `Enriched SingleBin ${singleBin.id} with sensor data`);
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

  // Get Compartments from Firestore
  static async getCompartments() {
    try {
      logger.debug(MODULE, 'Getting Compartments from Firestore...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const compartmentsCollection = collection(db, 'compartments');
      const compartmentsSnapshot = await getDocs(compartmentsCollection);
      
      if (!compartmentsSnapshot.empty) {
        const compartments = compartmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${compartments.length} Compartments`);
        return compartments;
      }
      
      logger.debug(MODULE, 'No Compartments found in Firestore');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching Compartments:', error);
      return [];
    }
  }

  // Get Alerts from Firestore
  static async getAlerts() {
    try {
      logger.debug(MODULE, 'Getting Alerts from Firestore...');
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const alertsCollection = collection(db, 'alerts');
      const alertsQuery = firestoreQuery(
        alertsCollection,
        orderBy('created_at', 'desc'),
        limit(50)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      
      if (!alertsSnapshot.empty) {
        const alerts = alertsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        logger.info(MODULE, `Retrieved ${alerts.length} Alerts`);
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
          const alertsSnapshot = await getDocs(alertsCollection);
          
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

  // Save Alert to Firestore
  static async saveAlert(alertData) {
    try {
      logger.debug(MODULE, 'Saving Alert to Firestore:', alertData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      const alertId = alertData.id || `alert-${Date.now()}`;
      const alertRef = doc(db, 'alerts', alertId);
      
      const dataToSave = {
        ...alertData,
        id: alertId,
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
  static subscribeToSensorData(deviceId, callback) {
    logger.debug(MODULE, `Subscribing to real-time updates for device: ${deviceId}`);
    
    if (!db) {
      logger.error(MODULE, 'Firestore is not initialized');
      return null;
    }
    
    try {
      const deviceCollection = `sensor-data-${deviceId}`;
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
      
      logger.success(MODULE, 'Real-time subscription established');
      return unsubscribe;
      
    } catch (error) {
      logger.error(MODULE, 'Error setting up real-time subscription:', error);
      return null;
    }
  }

  // Get historical sensor data
  static async getHistoricalData(deviceId, limitCount = 100) {
    logger.debug(MODULE, `Getting historical data for device: ${deviceId}`, { limit: limitCount });
    
    try {
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        return [];
      }
      
      const deviceCollection = `sensor-data-${deviceId}`;
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
        logger.info(MODULE, `Retrieved ${historicalData.length} historical records`);
        return historicalData;
      }
      
      logger.debug(MODULE, 'No historical data found');
      return [];
      
    } catch (error) {
      logger.error(MODULE, 'Error fetching historical data:', error);
      
      if (error.code === 'failed-precondition') {
        logger.debug(MODULE, 'Retrying without orderBy...');
        try {
          const deviceCollection = `sensor-data-${deviceId}`;
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
      // Get existing alerts to avoid duplicates
      const existingAlerts = await this.getAlerts();
      
      // Helper function to check if alert already exists
      const alertExists = (binId, alertType, severity) => {
        // Check for recent alerts (within last 30 minutes) with same bin, type, and severity
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        
        return existingAlerts.some(alert => 
          alert.bin_id === binId &&
          alert.alert_type === alertType &&
          alert.severity === severity &&
          alert.status === 'active' &&
          alert.created_at > thirtyMinutesAgo
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
          
          // Progressive severity levels
          let severity = null;
          if (fillPercentage >= 95) {
            severity = 'critical';
          } else if (fillPercentage >= threshold) {
            severity = 'high';
          } else if (fillPercentage >= threshold - 5) {
            severity = 'medium';
          }
          
          // Create alert if threshold exceeded and no recent alert exists
          if (severity && !alertExists(bin.id, 'fill_level', severity)) {
            // Auto-resolve lower severity alerts when upgrading to higher severity
            if (severity === 'critical') {
              await this.autoResolveAlertsForBin(bin.id, ['high', 'medium']);
            } else if (severity === 'high') {
              await this.autoResolveAlertsForBin(bin.id, ['medium']);
            }
            
            const alert = {
              id: `alert-${bin.id}-fill-${severity}-${Date.now()}`,
              bin_id: bin.id,
              binName: bin.name || `Bin ${bin.id}`,
              binType: 'SingleBin',
              alert_type: 'fill_level',
              severity: severity,
              message: `${bin.name || 'Bin'} has reached ${fillPercentage}% capacity`,
              currentValue: fillPercentage,
              threshold: threshold,
              unit: '%',
              status: 'active',
              acknowledged: false,
              location: bin.location || 'Unknown',
              created_at: new Date().toISOString(),
              timestamp: new Date().toISOString()
            };
            
            await this.saveAlert(alert);
            newAlerts.push(alert);
            
            logger.info(MODULE, `🚨 Created ${severity} fill level alert for SingleBin: ${bin.name} (${fillPercentage}%)`);
          }
          
        } catch (error) {
          logger.error(MODULE, `Error monitoring bin ${bin.id}:`, error);
        }
      }
      
      // Monitor Compartments
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
          
          // Progressive severity levels
          let severity = null;
          if (fillPercentage >= 95) {
            severity = 'critical';
          } else if (fillPercentage >= threshold) {
            severity = 'high';
          } else if (fillPercentage >= threshold - 5) {
            severity = 'medium';
          }
          
          // Create alert if threshold exceeded and no recent alert exists
          if (severity && !alertExists(compartment.id, 'fill_level', severity)) {
            // Auto-resolve lower severity alerts when upgrading to higher severity
            if (severity === 'critical') {
              await this.autoResolveAlertsForBin(compartment.id, ['high', 'medium']);
            } else if (severity === 'high') {
              await this.autoResolveAlertsForBin(compartment.id, ['medium']);
            }
            
            const alert = {
              id: `alert-${compartment.id}-fill-${severity}-${Date.now()}`,
              compartment_id: compartment.id,
              binName: compartment.label || `Compartment ${compartment.id}`,
              binType: 'Compartment',
              alert_type: 'fill_level',
              severity: severity,
              message: `${compartment.label || 'Compartment'} has reached ${fillPercentage}% capacity`,
              currentValue: fillPercentage,
              threshold: threshold,
              unit: '%',
              status: 'active',
              acknowledged: false,
              location: compartment.location || 'Unknown',
              created_at: new Date().toISOString(),
              timestamp: new Date().toISOString()
            };
            
            await this.saveAlert(alert);
            newAlerts.push(alert);
            
            logger.info(MODULE, `🚨 Created ${severity} fill level alert for Compartment: ${compartment.label} (${fillPercentage}%)`);
          }
          
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

  // ✅ Save SmartBin to Firestore
  static async saveSmartBin(smartBinData) {
    try {
      logger.debug(MODULE, 'Saving SmartBin to Firestore:', smartBinData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Generate ID if not provided
      const binId = smartBinData.id || `smart-bin-${Date.now()}`;
      
      // Extract compartments if they exist
      const compartments = smartBinData.compartments || [];
      
      // Prepare SmartBin data (without separate compartments for now)
      const smartBinPayload = {
        ...smartBinData,
        id: binId,
        updated_at: new Date().toISOString(),
        created_at: smartBinData.created_at || new Date().toISOString()
      };
      
      // Save SmartBin to Firestore
      const binRef = doc(db, 'smart-bins', binId);
      await setDoc(binRef, smartBinPayload, { merge: true });
      
      logger.success(MODULE, `SmartBin saved successfully: ${binId}`);
      
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
            updated_at: new Date().toISOString(),
            created_at: comp.created_at || new Date().toISOString(),
            created_by: smartBinData.created_by || 'admin@sortyx.com'
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

  // ✅ Save SingleBin to Firestore
  static async saveSingleBin(singleBinData) {
    try {
      logger.debug(MODULE, 'Saving SingleBin to Firestore:', singleBinData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Generate ID if not provided
      const binId = singleBinData.id || `single-bin-${Date.now()}`;
      const binRef = doc(db, 'single-bins', binId);
      
      // Prepare data with timestamp
      const dataToSave = {
        ...singleBinData,
        id: binId,
        updated_at: new Date().toISOString(),
        created_at: singleBinData.created_at || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(binRef, dataToSave, { merge: true });
      
      logger.success(MODULE, `SingleBin saved successfully: ${binId}`);
      return { id: binId, ...dataToSave };
      
    } catch (error) {
      logger.error(MODULE, 'Error saving SingleBin:', error);
      throw error;
    }
  }

  // ✅ Save Compartment to Firestore
  static async saveCompartment(compartmentData) {
    try {
      logger.debug(MODULE, 'Saving Compartment to Firestore:', compartmentData);
      
      if (!db) {
        logger.error(MODULE, 'Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Generate ID if not provided
      const compartmentId = compartmentData.id || `compartment-${Date.now()}`;
      const compartmentRef = doc(db, 'compartments', compartmentId);
      
      // Prepare data with timestamp
      const dataToSave = {
        ...compartmentData,
        id: compartmentId,
        updated_at: new Date().toISOString(),
        created_at: compartmentData.created_at || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(compartmentRef, dataToSave, { merge: true });
      
      logger.success(MODULE, `Compartment saved successfully: ${compartmentId}`);
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
}
