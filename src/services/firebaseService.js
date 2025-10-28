import { database, db } from '../config/firebase';
import { ref, onValue, push, set, get, query, orderByChild, limitToLast, orderByKey, child } from 'firebase/database';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, orderBy, limit, where, query as firestoreQuery } from 'firebase/firestore';

export class FirebaseService {
  
  // Verify Firestore connection
  static async verifyConnection() {
    try {
      console.log('🔍 Verifying Firestore connection...');
      
      if (!db) {
        console.error('❌ Firestore instance (db) is not initialized');
        return false;
      }
      
      console.log('✅ Firestore instance exists:', db);
      
      // Try to read a test collection to verify connection
      const testCollection = collection(db, 'health-check');
      const testQuery = firestoreQuery(testCollection, limit(1));
      const snapshot = await getDocs(testQuery);
      
      console.log('✅ Firestore connection verified successfully');
      console.log('📊 Test query returned', snapshot.size, 'document(s)');
      return true;
      
    } catch (error) {
      console.error('❌ Firestore connection verification failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('🔒 Firestore security rules are blocking access');
        console.error('💡 Check your Firestore security rules in Firebase Console');
      } else if (error.code === 'unavailable') {
        console.error('🌐 Network connection issue - check internet connectivity');
      }
      
      return false;
    }
  }
  
  // Dynamically discover available collections in Firestore
  static async discoverCollections() {
    try {
      console.log('🔍 Discovering Firestore collections...');
      
      // List of known collection patterns to check
      const knownPatterns = [
        'iot-devices',
        'smart-bins',
        'single-bins',
        'compartments',
        'alerts',
        'users',
        'all-sensor-data',
        'sensor-data-*'
      ];
      
      const foundCollections = [];
      
      for (const pattern of knownPatterns) {
        try {
          if (pattern.includes('*')) {
            // Handle wildcard patterns
            const basePattern = pattern.replace('*', '');
            // Check common device IDs
            const deviceIds = ['sortyx-sensor-two', 'sortyx-sensor-three', 'sortyx-sensor-four','sortyx-sensor-five','plaese-work'];
            for (const deviceId of deviceIds) {
              const collectionName = `${basePattern}${deviceId}`;
              const testRef = collection(db, collectionName);
              const testSnapshot = await getDocs(firestoreQuery(testRef, limit(1)));
              if (!testSnapshot.empty) {
                foundCollections.push(collectionName);
                console.log(`✅ Found collection: ${collectionName}`);
              }
            }
          } else {
            // Check exact collection name
            const testRef = collection(db, pattern);
            const testSnapshot = await getDocs(firestoreQuery(testRef, limit(1)));
            if (!testSnapshot.empty) {
              foundCollections.push(pattern);
              console.log(`✅ Found collection: ${pattern} (${testSnapshot.size} documents)`);
            }
          }
        } catch (error) {
          // Collection doesn't exist or no permission, continue
          console.log(`⏭️ Skipping collection: ${pattern}`);
        }
      }
      
      console.log('📦 Discovered collections:', foundCollections);
      return foundCollections;
      
    } catch (error) {
      console.error('❌ Error discovering collections:', error);
      return [];
    }
  }
  
  // Get all sensor data collections from FIRESTORE (now dynamic)
  static async getSensorCollections() {
    try {
      console.log('🔍 Getting sensor data collections from Firestore...');
      
      // First verify connection
      const isConnected = await this.verifyConnection();
      if (!isConnected) {
        console.error('❌ Firestore connection failed - returning empty array');
        return [];
      }
      
      // Try to discover collections dynamically
      const discoveredCollections = await this.discoverCollections();
      
      // Filter for sensor data collections
      const sensorCollections = discoveredCollections.filter(name => 
        name.includes('sensor-data') || name.includes('iot-data')
      );
      
      if (sensorCollections.length > 0) {
        console.log('✅ Found sensor collections:', sensorCollections);
        return sensorCollections;
      }
      
      // Fallback to known collections
      const knownCollections = [
        'all-sensor-data',
        'sensor-data-plaese-work',
        'sensor-data-sortyx-sensor-two',
        'sensor-data-sortyx-sensor-three',
        'sensor-data-sortyx-sensor-four',
        'sensor-data-sortyx-sensor-five',
        'iot-data',
        'health-check'
      ];
      
      console.log('⚠️ Using fallback sensor collections:', knownCollections);
      return knownCollections;
      
    } catch (error) {
      console.error('❌ Error getting sensor collections:', error);
      return [];
    }
  }

  // Get latest sensor data for a specific device from FIRESTORE
  static async getLatestSensorData(deviceId = 'sortyx-sensor-two') {
    console.log(`🔍 Getting latest sensor data for device: ${deviceId}`);
    
    try {
      // Verify Firestore connection first
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return null;
      }
      
      // Try device-specific collection first
      const deviceCollection = `sensor-data-${deviceId}`;
      console.log(`🎯 Checking Firestore collection: ${deviceCollection}`);
      
      const deviceCollectionRef = collection(db, deviceCollection);
      const deviceQuery = firestoreQuery(
        deviceCollectionRef,
        orderBy('receivedAt', 'desc'),
        limit(1)
      );
      
      const deviceSnapshot = await getDocs(deviceQuery);
      
      if (!deviceSnapshot.empty) {
        const latestDoc = deviceSnapshot.docs[0];
        const data = latestDoc.data();
        console.log(`✅ Found latest data in ${deviceCollection}:`, data);
        return this.formatSensorData(data);
      }
      
      // Fallback to all-sensor-data collection
      console.log(`⚡ Trying fallback: all-sensor-data collection`);
      const allDataRef = collection(db, 'all-sensor-data');
      const allDataQuery = firestoreQuery(
        allDataRef,
        orderBy('receivedAt', 'desc'),
        limit(50) // Get more to filter by device
      );
      
      const allSnapshot = await getDocs(allDataQuery);
      
      if (!allSnapshot.empty) {
        // Find entries for this specific device
        const deviceDocs = allSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.deviceId === deviceId || 
                 doc.id.includes(deviceId) ||
                 JSON.stringify(data).includes(deviceId);
        });
        
        if (deviceDocs.length > 0) {
          const latestData = deviceDocs[0].data();
          console.log(`📊 Found data in all-sensor-data for ${deviceId}:`, latestData);
          return this.formatSensorData(latestData);
        }
      }
      
      console.log(`⚠️ No sensor data found for device: ${deviceId}`);
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching latest sensor data:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('🔒 Permission denied - check Firestore security rules');
      }
      
      return null;
    }
  }

  // Get available IoT devices filtered by user's App ID
  static async getAvailableDevices(userAppId = null) {
    try {
      console.log('🔍 Getting available IoT devices for Application ID:', userAppId);
      
      // Verify Firestore connection first
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return [];
      }
      
      console.log('📡 Discovering all sensor-data-* collections...');
      
      // Step 1: Discover all sensor-data-* collections dynamically
      const allCollections = await this.discoverCollections();
      const sensorDataCollections = allCollections.filter(name => 
        name.startsWith('sensor-data-')
      );
      
      console.log(`✅ Found ${sensorDataCollections.length} sensor-data-* collections:`, sensorDataCollections);
      
      if (sensorDataCollections.length === 0) {
        console.log('⚠️ No sensor-data-* collections found');
        return [];
      }
      
      // Step 2: Query each collection and extract device information
      const allDevices = [];
      const deviceMap = new Map(); // Use Map to avoid duplicates
      
      for (const collectionName of sensorDataCollections) {
        try {
          console.log(`🔎 Querying collection: ${collectionName}`);
          
          const collectionRef = collection(db, collectionName);
          const q = firestoreQuery(collectionRef, limit(1)); // Get latest document to extract device info
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const latestDoc = snapshot.docs[0];
            const data = latestDoc.data();
            
            // Extract device ID from collection name or document data
            const deviceId = collectionName.replace('sensor-data-', '') || 
                           data.end_device_ids?.device_id || 
                           data.deviceId;
            
            // Extract application ID
            const appId = data.end_device_ids?.application_ids?.application_id || 
                         data.applicationId || 
                         data.application_id;
            
            // Filter by applicationId if provided
            if (userAppId && appId && appId !== userAppId) {
              console.log(`⏭️ Skipping device ${deviceId} - applicationId mismatch (${appId} !== ${userAppId})`);
              continue;
            }
            
            // Create device object
            const device = {
              id: deviceId,
              deviceId: deviceId,
              collectionName: collectionName,
              applicationId: appId,
              lastSeen: data.received_at || data.receivedAt || new Date().toISOString(),
              status: 'active',
              // Include latest sensor data
              latestData: this.formatSensorData(data)
            };
            
            // Add to map (prevents duplicates)
            if (!deviceMap.has(deviceId)) {
              deviceMap.set(deviceId, device);
              console.log(`✅ Added device: ${deviceId} (App ID: ${appId || 'N/A'})`);
            }
          }
        } catch (collectionError) {
          console.error(`❌ Error querying collection ${collectionName}:`, collectionError.message);
          // Continue with next collection
        }
      }
      
      // Convert Map to array
      const devices = Array.from(deviceMap.values());
      
      console.log(`✅ Retrieved ${devices.length} IoT devices from sensor-data-* collections`);
      console.log('📦 Devices:', devices);
      
      if (devices.length === 0) {
        console.log('⚠️ No IoT devices found in sensor-data-* collections');
        console.log('💡 Troubleshooting tips:');
        console.log('   1. Check if sensor-data-* collections have documents');
        console.log('   2. Verify documents have device identification fields');
        console.log('   3. If filtering by applicationId, ensure it matches:', userAppId);
        console.log('   4. Check Firestore security rules allow reading these collections');
      }
      
      return devices;
      
    } catch (error) {
      console.error('❌ Error fetching available devices:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      
      if (error.code === 'permission-denied') {
        console.error('🔒 Permission denied - check Firestore security rules');
      } else if (error.code === 'unavailable') {
        console.error('🌐 Network unavailable - check internet connection');
      }
      
      return [];
    }
  }

  // Get user's App ID from their profile
  static async getUserAppId(userId) {
    try {
      console.log('🔍 Getting Application ID for user:', userId);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return null;
      }
      
      // Get user from Firestore 'users' collection
      const userDoc = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const appId = userData.applicationId || userData.app_id || userData.appId;
        console.log(`✅ Found Application ID for user ${userId}: ${appId}`);
        return appId;
      }
      
      console.log('⚠️ User not found or has no Application ID');
      return null;
      
    } catch (error) {
      console.error('❌ Error fetching user Application ID:', error);
      return null;
    }
  }

  // Get SmartBins from Firestore
  static async getSmartBins() {
    try {
      console.log('🔍 Getting SmartBins from Firestore...');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return [];
      }
      
      const smartBinsCollection = collection(db, 'smart-bins');
      const smartBinsSnapshot = await getDocs(smartBinsCollection);
      
      if (!smartBinsSnapshot.empty) {
        const smartBins = smartBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Retrieved ${smartBins.length} SmartBins from Firestore`);
        return smartBins;
      }
      
      console.log('⚠️ No SmartBins found in Firestore');
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching SmartBins:', error);
      return [];
    }
  }

  // Get SingleBins from Firestore
  static async getSingleBins() {
    try {
      console.log('🔍 Getting SingleBins from Firestore...');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return [];
      }
      
      const singleBinsCollection = collection(db, 'single-bins');
      const singleBinsSnapshot = await getDocs(singleBinsCollection);
      
      if (!singleBinsSnapshot.empty) {
        const singleBins = singleBinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Retrieved ${singleBins.length} SingleBins from Firestore`);
        return singleBins;
      }
      
      console.log('⚠️ No SingleBins found in Firestore');
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching SingleBins:', error);
      return [];
    }
  }

  // Get SingleBins with enriched sensor data from linked IoT devices
  static async getSingleBinsWithSensorData() {
    try {
      console.log('🔍 Getting SingleBins with enriched sensor data...');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return [];
      }
      
      // Get all SingleBins
      const singleBins = await this.getSingleBins();
      
      if (singleBins.length === 0) {
        return [];
      }
      
      // Enrich each SingleBin with sensor data from its linked IoT device
      const enrichedSingleBins = await Promise.all(
        singleBins.map(async (singleBin) => {
          try {
            // Check if the SingleBin has a linked IoT device
            const deviceId = singleBin.iot_device_id || singleBin.device_id || singleBin.deviceId;
            
            if (!deviceId) {
              console.log(`⚠️ SingleBin ${singleBin.id} has no linked IoT device`);
              return singleBin;
            }
            
            // Get latest sensor data for this device
            const sensorData = await this.getLatestSensorData(deviceId);
            
            if (!sensorData) {
              console.log(`⚠️ No sensor data found for device ${deviceId}`);
              return singleBin;
            }
            
            // Map sensor data to SingleBin properties
            const enrichedBin = {
              ...singleBin,
              // Distance & Fill Level
              distance: sensorData.distance,
              fill_level: sensorData.fillLevel,
              current_fill: sensorData.fillLevel,
              // Battery
              battery_level: sensorData.battery,
              // Environmental sensors
              temperature: sensorData.temperature,
              humidity: sensorData.humidity,
              // Additional sensor data based on enabled sensors
              air_quality: sensorData.raw?.uplink_message?.decoded_payload?.air_quality || 
                          sensorData.raw?.decoded_payload?.air_quality,
              odour_level: sensorData.raw?.uplink_message?.decoded_payload?.odour_level || 
                          sensorData.raw?.decoded_payload?.odour_level,
              // Tilt/tamper detection
              tilt_status: sensorData.tilt,
              // Metadata
              last_sensor_update: sensorData.timestamp,
              sensor_data_available: true
            };
            
            console.log(`✅ Enriched SingleBin ${singleBin.id} with sensor data from ${deviceId}`);
            return enrichedBin;
            
          } catch (error) {
            console.error(`❌ Error enriching SingleBin ${singleBin.id}:`, error);
            return singleBin; // Return original bin if enrichment fails
          }
        })
      );
      
      console.log(`✅ Enriched ${enrichedSingleBins.length} SingleBins with sensor data`);
      return enrichedSingleBins;
      
    } catch (error) {
      console.error('❌ Error fetching SingleBins with sensor data:', error);
      return [];
    }
  }

  // Get Compartments from Firestore
  static async getCompartments() {
    try {
      console.log('🔍 Getting Compartments from Firestore...');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        return [];
      }
      
      const compartmentsCollection = collection(db, 'compartments');
      const compartmentsSnapshot = await getDocs(compartmentsCollection);
      
      if (!compartmentsSnapshot.empty) {
        const compartments = compartmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Retrieved ${compartments.length} Compartments from Firestore`);
        return compartments;
      }
      
      console.log('⚠️ No Compartments found in Firestore');
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching Compartments:', error);
      return [];
    }
  }

  // Get Alerts from Firestore
  static async getAlerts() {
    try {
      console.log('🔍 Getting Alerts from Firestore...');
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
        console.log(`✅ Retrieved ${alerts.length} Alerts from Firestore`);
        return alerts;
      }
      
      console.log('⚠️ No Alerts found in Firestore');
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching Alerts:', error);
      
      // Try without orderBy if there's an index error
      if (error.code === 'failed-precondition') {
        console.log('⚡ Retrying without orderBy...');
        try {
          const alertsCollection = collection(db, 'alerts');
          const alertsSnapshot = await getDocs(alertsCollection);
          
          if (!alertsSnapshot.empty) {
            const alerts = alertsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`✅ Retrieved ${alerts.length} Alerts (without ordering)`);
            return alerts;
          }
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
        }
      }
      
      return [];
    }
  }

  // Save Alert to Firestore
  static async saveAlert(alertData) {
    try {
      console.log('💾 Saving Alert to Firestore:', alertData);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Generate ID if not provided
      const alertId = alertData.id || `alert-${Date.now()}`;
      const alertRef = doc(db, 'alerts', alertId);
      
      // Prepare data with timestamp
      const dataToSave = {
        ...alertData,
        id: alertId,
        updated_at: new Date().toISOString(),
        created_at: alertData.created_at || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(alertRef, dataToSave, { merge: true });
      
      console.log('✅ Alert saved successfully:', alertId);
      return { id: alertId, ...dataToSave };
      
    } catch (error) {
      console.error('❌ Error saving Alert:', error);
      throw error;
    }
  }

  // Update Alert in Firestore (useful for marking alerts as resolved)
  static async updateAlert(alertId, updateData) {
    try {
      console.log('🔄 Updating Alert in Firestore:', alertId, updateData);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      const alertRef = doc(db, 'alerts', alertId);
      
      // Prepare update data with timestamp
      const dataToUpdate = {
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      // Update in Firestore
      await updateDoc(alertRef, dataToUpdate);
      
      console.log('✅ Alert updated successfully:', alertId);
      return { id: alertId, ...dataToUpdate };
      
    } catch (error) {
      console.error('❌ Error updating Alert:', error);
      throw error;
    }
  }

  // Delete Alert from Firestore
  static async deleteAlert(alertId) {
    try {
      console.log('🗑️ Deleting Alert from Firestore:', alertId);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the alert document
      const alertRef = doc(db, 'alerts', alertId);
      await deleteDoc(alertRef);
      
      console.log('✅ Alert deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting Alert:', error);
      throw error;
    }
  }

  // Subscribe to real-time sensor data updates
  static subscribeToSensorData(deviceId, callback) {
    console.log(`🔔 Subscribing to real-time updates for device: ${deviceId}`);
    
    if (!db) {
      console.error('❌ Firestore is not initialized');
      return null;
    }
    
    try {
      // Subscribe to device-specific collection
      const deviceCollection = `sensor-data-${deviceId}`;
      const deviceCollectionRef = collection(db, deviceCollection);
      const deviceQuery = firestoreQuery(
        deviceCollectionRef,
        orderBy('receivedAt', 'desc'),
        limit(10)
      );
      
      console.log(`📡 Setting up real-time listener on: ${deviceCollection}`);
      
      const unsubscribe = onSnapshot(
        deviceQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const sensorData = snapshot.docs.map(doc => {
              const data = doc.data();
              return this.formatSensorData(data);
            });
            console.log(`🔄 Real-time update received: ${sensorData.length} records`);
            callback(sensorData);
          } else {
            console.log('⚠️ Real-time update: No data in snapshot');
            callback([]);
          }
        },
        (error) => {
          console.error('❌ Real-time subscription error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          if (error.code === 'failed-precondition') {
            console.error('💡 Firestore index required. Retrying without orderBy...');
            
            // Retry without orderBy
            const simpleQuery = firestoreQuery(deviceCollectionRef, limit(10));
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
              (err) => console.error('❌ Retry subscription error:', err)
            );
          }
        }
      );
      
      console.log('✅ Real-time subscription established');
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error);
      return null;
    }
  }

  // Get historical sensor data
  static async getHistoricalData(deviceId, limitCount = 100) {
    console.log(`📊 Getting historical data for device: ${deviceId}`);
    
    try {
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
        console.log(`✅ Retrieved ${historicalData.length} historical records`);
        return historicalData;
      }
      
      console.log('⚠️ No historical data found');
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      
      // Try without orderBy if index error
      if (error.code === 'failed-precondition') {
        console.log('⚡ Retrying without orderBy...');
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
            console.log(`✅ Retrieved ${historicalData.length} historical records (unordered)`);
            return historicalData;
          }
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
        }
      }
      
      return [];
    }
  }

  // Format sensor data to consistent structure
  static formatSensorData(data) {
    // Handle different data structures from Firestore
    const uplink = data.uplink_message || data.uplinkMessage || data;
    const decoded = uplink.decoded_payload || uplink.decodedPayload || data;
    
    return {
      deviceId: data.end_device_ids?.device_id || data.deviceId || 'unknown',
      timestamp: data.received_at || data.receivedAt || new Date().toISOString(),
      distance: decoded.distance || decoded.Distance || 0,
      fillLevel: decoded.fillLevel || decoded.FillLevel || 0,
      battery: decoded.battery || decoded.Battery || 100,
      tilt: decoded.tilt || decoded.Tilt || 'normal',
      temperature: decoded.temperature || decoded.Temperature || null,
      humidity: decoded.humidity || decoded.Humidity || null,
      raw: data
    };
  }

  // Save SmartBin to Firestore
  static async saveSmartBin(smartBinData) {
    try {
      console.log('💾 Saving SmartBin to Firestore:', smartBinData);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
      
      console.log('✅ SmartBin saved successfully:', binId);
      
      // If compartments are included, save them separately to the compartments collection
      if (compartments.length > 0) {
        console.log(`📦 Saving ${compartments.length} compartments to compartments collection...`);
        
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
          
          console.log(`✅ Compartment saved: ${compartmentId} (${comp.name})`);
          return compartmentPayload;
        });
        
        const savedCompartments = await Promise.all(compartmentSavePromises);
        console.log(`✅ All ${savedCompartments.length} compartments saved successfully`);
        
        // Return the SmartBin with the saved compartments
        return { 
          ...smartBinPayload, 
          compartments: savedCompartments 
        };
      }
      
      return smartBinPayload;
      
    } catch (error) {
      console.error('❌ Error saving SmartBin:', error);
      throw error;
    }
  }

  // Save SingleBin to Firestore
  static async saveSingleBin(singleBinData) {
    try {
      console.log('💾 Saving SingleBin to Firestore:', singleBinData);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
      
      console.log('✅ SingleBin saved successfully:', binId);
      return { id: binId, ...dataToSave };
      
    } catch (error) {
      console.error('❌ Error saving SingleBin:', error);
      throw error;
    }
  }

  // Save Compartment to Firestore
  static async saveCompartment(compartmentData) {
    try {
      console.log('💾 Saving Compartment to Firestore:', compartmentData);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
      
      console.log('✅ Compartment saved successfully:', compartmentId);
      return { id: compartmentId, ...dataToSave };
      
    } catch (error) {
      console.error('❌ Error saving Compartment:', error);
      throw error;
    }
  }

  // Delete SmartBin from Firestore
  static async deleteSmartBin(binId) {
    try {
      console.log('🗑️ Deleting SmartBin from Firestore:', binId);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
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
      
      console.log(`✅ SmartBin and ${compartmentsSnapshot.size} compartments deleted successfully`);
      
    } catch (error) {
      console.error('❌ Error deleting SmartBin:', error);
      throw error;
    }
  }

  // Delete SingleBin from Firestore
  static async deleteSingleBin(binId) {
    try {
      console.log('🗑️ Deleting SingleBin from Firestore:', binId);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the single bin document
      const binRef = doc(db, 'single-bins', binId);
      await deleteDoc(binRef);
      
      console.log('✅ SingleBin deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting SingleBin:', error);
      throw error;
    }
  }

  // Delete Compartment from Firestore
  static async deleteCompartment(compartmentId) {
    try {
      console.log('🗑️ Deleting Compartment from Firestore:', compartmentId);
      
      if (!db) {
        console.error('❌ Firestore is not initialized');
        throw new Error('Firestore is not initialized');
      }
      
      // Delete the compartment document
      const compartmentRef = doc(db, 'compartments', compartmentId);
      await deleteDoc(compartmentRef);
      
      console.log('✅ Compartment deleted successfully');
      
    } catch (error) {
      console.error('❌ Error deleting Compartment:', error);
      throw error;
    }
  }
}