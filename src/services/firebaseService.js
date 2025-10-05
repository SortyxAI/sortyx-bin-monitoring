import { database, db } from '../config/firebase';
import { ref, onValue, push, set, get, query, orderByChild, limitToLast, orderByKey, child } from 'firebase/database';
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot, orderBy, limit, where, query as firestoreQuery } from 'firebase/firestore';

export class FirebaseService {
  
  // Get all sensor data collections from FIRESTORE
  static async getSensorCollections() {
    try {
      // We can't list collections in Firestore easily, so return known collections
      const knownCollections = [
        'all-sensor-data',
        'sensor-data-plaese-work',
        'sensor-data-sortyx-sensor-two',
        'sensor-data-bin-sensor-001',
        'sensor-data-bin-sensor-002',
        'sensor-data-environmental-001',
        'iot-data',
        'health-check'
      ];
      
      console.log('🎯 Known Firestore sensor collections:', knownCollections);
      return knownCollections;
    } catch (error) {
      console.error('Error with sensor collections:', error);
      return [];
    }
  }

  // Get latest sensor data for a specific device from FIRESTORE
  static async getLatestSensorData(deviceId = 'sortyx-sensor-two') {
    console.log(`🔍 Getting latest sensor data for device: ${deviceId}`);
    
    try {
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
      return null;
    }
  }
  


  // Get historical sensor data
  static async getHistoricalData(deviceId = 'sortyx-sensor-two', limit = 50) {
    try {
      const deviceCollection = `sensor-data-${deviceId}`;
      const deviceSensorRef = ref(database, deviceCollection);
      
      const snapshot = await get(deviceSensorRef);
      const data = snapshot.val();
      
      if (data) {
        const entries = Object.values(data)
          .sort((a, b) => {
            const timeA = new Date(a.timestamp || a.receivedAt || 0);
            const timeB = new Date(b.timestamp || b.receivedAt || 0);
            return timeB - timeA;
          })
          .slice(0, limit);
        
        return entries.map(entry => this.formatSensorData(entry));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  // Subscribe to real-time sensor data updates from FIRESTORE
  static subscribeToSensorData(deviceId = 'sortyx-sensor-two', callback, errorCallback) {
    console.log(`🔔 Subscribing to Firestore sensor data for device: ${deviceId}`);
    
    try {
      // Subscribe to device-specific collection
      const deviceCollection = `sensor-data-${deviceId}`;
      const deviceCollectionRef = collection(db, deviceCollection);
      const deviceQuery = firestoreQuery(
        deviceCollectionRef,
        orderBy('receivedAt', 'desc'),
        limit(1)
      );
      
      const unsubscribe = onSnapshot(deviceQuery, (snapshot) => {
        console.log(`📡 Firestore real-time update for ${deviceId}:`, snapshot.docs.length, 'docs');
        
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0];
          const data = latestDoc.data();
          console.log(`📊 Latest real-time data:`, data);
          
          const formattedData = this.formatSensorData(data);
          callback(formattedData);
        } else {
          console.log(`⚠️ No real-time data found for ${deviceId}`);
          callback(null);
        }
      }, (error) => {
        console.error(`❌ Error in Firestore subscription for ${deviceId}:`, error);
        if (errorCallback) errorCallback(error);
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ Error setting up Firestore subscription:', error);
      if (errorCallback) errorCallback(error);
      return () => {};
    }
  }

  // Format sensor data to a consistent structure
  static formatSensorData(rawData) {
    if (!rawData) return null;
    
    console.log('🔧 Formatting raw data:', rawData);
    
    // Handle your actual Firebase structure
    let sensorData = rawData;
    
    // Your data has a nested sensorData field
    if (rawData.sensorData) {
      sensorData = rawData.sensorData;
      console.log('📊 Using nested sensorData:', sensorData);
    }
    
    // Handle The Things Network structure (fallback)
    if (rawData.uplink_message && rawData.uplink_message.decoded_payload) {
      sensorData = rawData.uplink_message.decoded_payload;
    }
    
    // Extract the actual values from your structure
    const battery = sensorData.battery || sensorData.bat || 0;
    const distance = sensorData.distance || sensorData.dist || 0;
    
    // Handle tilt field - your data has "normal" as string, convert to number
    let tilt = sensorData.tilt || sensorData.t || 0;
    if (tilt === "normal") tilt = 0;
    if (typeof tilt === 'string') {
      const tiltNum = parseFloat(tilt);
      tilt = isNaN(tiltNum) ? 0 : tiltNum;
    }
    
    const result = {
      battery: battery,
      distance: distance,
      tilt: tilt,
      fillLevel: this.calculateFillLevel(distance),
      timestamp: rawData.timestamp || rawData.receivedAt || rawData.received_at || new Date().toISOString(),
      deviceId: rawData.deviceId || rawData.device_id || 'unknown',
      // Include additional fields from your data
      snr: sensorData.snr || null,
      rssi: rawData.rssi || null,
      receivedAt: rawData.receivedAt || null
    };
    
    console.log('✅ Formatted sensor data:', result);
    return result;
  }

  // Calculate fill level based on distance
  static calculateFillLevel(distance) {
    // Assuming bin height is 100cm, fill level = (100 - distance) / 100 * 100%
    const binHeight = 100;
    const fillLevel = Math.max(0, Math.min(100, ((binHeight - distance) / binHeight) * 100));
    return Math.round(fillLevel);
  }

  // Get smart bins from Firestore with live sensor data
  static async getSmartBins() {
    try {
      console.log('📦 Fetching smart bins from Firestore...');
      
      // Get bins from Firestore
      const binsCollection = collection(db, 'smart-bins');
      const binsSnapshot = await getDocs(binsCollection);
      
      if (!binsSnapshot.empty) {
        const bins = [];
        
        for (const binDoc of binsSnapshot.docs) {
          const binData = { id: binDoc.id, ...binDoc.data() };
          
          // If bin has a device_id, get live sensor data
          if (binData.device_id || binData.deviceId) {
            const deviceId = binData.device_id || binData.deviceId;
            console.log(`🔄 Getting live data for bin ${binData.name} with device ${deviceId}`);
            const liveSensorData = await this.getLatestSensorData(deviceId);
            
            if (liveSensorData) {
              // Merge live sensor data with bin configuration
              binData.current_fill = liveSensorData.fillLevel || 0;
              binData.fillLevel = liveSensorData.fillLevel || 0; // For compatibility
              binData.battery_level = liveSensorData.battery || 0;
              binData.battery = liveSensorData.battery || 0; // For compatibility
              binData.distance = liveSensorData.distance || 0;
              binData.current_sensor_data = liveSensorData;
              binData.last_sensor_update = new Date().toISOString();
              binData.lastUpdate = new Date().toISOString(); // For compatibility
              
              console.log(`✅ Updated ${binData.name} with live data:`, {
                fillLevel: liveSensorData.fillLevel,
                battery: liveSensorData.battery,
                distance: liveSensorData.distance
              });
            }
          }
          
          bins.push(binData);
        }
        
        console.log(`📦 Retrieved ${bins.length} smart bins from Firestore`);
        return bins;
      }
      
      // Return mock data if no bins in Firestore
      console.log('⚠️ No bins found in Firestore, returning mock data');
      return [
        {
          id: 'bin-1',
          name: 'Main Entrance Bin',
          location: 'Building A - Ground Floor',
          deviceId: 'sortyx-sensor-two',
          device_id: 'sortyx-sensor-two',
          status: 'active',
          fillLevel: 0,
          current_fill: 0,
          battery: 0,
          battery_level: 0,
          distance: 0,
          sensors_enabled: {
            fill_level: true,
            battery_level: true,
            temperature: false,
            humidity: false,
            air_quality: false,
            odour_detection: false
          },
          lastUpdate: new Date().toISOString(),
          last_sensor_update: new Date().toISOString(),
          compartments: [
            { type: 'recyclable', fillLevel: 0, color: '#10b981', current_fill: 0 },
            { type: 'general', fillLevel: 0, color: '#f59e0b', current_fill: 0 }
          ]
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching smart bins:', error);
      return [];
    }
  }

  // Get compartments from Firebase
  static async getCompartments() {
    try {
      const compartmentsRef = ref(database, 'compartments');
      const snapshot = await get(compartmentsRef);
      const data = snapshot.val();
      
      if (data) {
        return Object.entries(data).map(([id, compartment]) => ({
          id,
          ...compartment
        }));
      }
      
      // Return mock data if no compartments in Firebase
      return [
        {
          id: 'comp-1',
          binId: 'bin-1',
          type: 'recyclable',
          capacity: 50,
          fillLevel: 80,
          color: '#10b981',
          sensorId: 'sortyx-sensor-two'
        },
        {
          id: 'comp-2',
          binId: 'bin-1',
          type: 'general',
          capacity: 50,
          fillLevel: 70,
          color: '#f59e0b',
          sensorId: 'sortyx-sensor-two'
        },
        {
          id: 'comp-3',
          binId: 'bin-2',
          type: 'organic',
          capacity: 40,
          fillLevel: 50,
          color: '#8b5cf6',
          sensorId: 'plaese-work'
        },
        {
          id: 'comp-4',
          binId: 'bin-2',
          type: 'general',
          capacity: 40,
          fillLevel: 40,
          color: '#f59e0b',
          sensorId: 'plaese-work'
        }
      ];
    } catch (error) {
      console.error('Error fetching compartments:', error);
      return [];
    }
  }

  // Get alerts from Firebase
  static async getAlerts() {
    try {
      const alertsRef = ref(database, 'alerts');
      const snapshot = await get(alertsRef);
      const data = snapshot.val();
      
      if (data) {
        return Object.entries(data).map(([id, alert]) => ({
          id,
          ...alert
        }));
      }
      
      // Return mock data if no alerts in Firebase
      return [
        {
          id: 'alert-1',
          binId: 'bin-1',
          type: 'fill_level',
          severity: 'high',
          message: 'Bin is 85% full and needs emptying',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          acknowledged: false
        },
        {
          id: 'alert-2',
          binId: 'bin-2',
          type: 'battery_low',
          severity: 'medium',
          message: 'Battery level is below 20%',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          acknowledged: true
        },
        {
          id: 'alert-3',
          binId: 'bin-1',
          type: 'tilt',
          severity: 'high',
          message: 'Bin has been tilted or moved',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          acknowledged: false
        }
      ];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  // Save smart bin to Firestore
  static async saveSmartBin(binData) {
    try {
      console.log('💾 Saving smart bin to Firestore:', binData);
      
      // Use Firestore for bin storage with better structure
      const binsCollection = collection(db, 'smart-bins');
      
      if (binData.id) {
        // Update existing bin
        const binDoc = doc(db, 'smart-bins', binData.id);
        const updatedData = {
          ...binData,
          updatedAt: new Date().toISOString()
        };
        await setDoc(binDoc, updatedData);
        console.log('✅ Updated existing bin:', updatedData);
        return updatedData;
      } else {
        // Create new bin with proper structure
        const newBinData = {
          ...binData,
          id: Date.now().toString(), // Simple ID generation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure sensor data structure
          sensors_enabled: binData.sensors_enabled || {},
          current_sensor_data: binData.current_sensor_data || {},
          device_id: binData.deviceId || binData.device_id,
          // Calculate fill level from sensor data if available
          current_fill: binData.current_sensor_data?.fillLevel || 0,
          battery_level: binData.current_sensor_data?.battery || 0,
          distance: binData.current_sensor_data?.distance || 0,
          last_sensor_update: new Date().toISOString()
        };
        
        const newBinDoc = doc(db, 'smart-bins', newBinData.id);
        await setDoc(newBinDoc, newBinData);
        console.log('✅ Created new bin:', newBinData);
        return newBinData;
      }
    } catch (error) {
      console.error('❌ Error saving smart bin:', error);
      throw error;
    }
  }

  // Save single bin to Firebase (alias for saveSmartBin)
  static async saveSingleBin(binData) {
    return this.saveSmartBin(binData);
  }

  // Update bin sensor configuration
  static async updateBinSensorConfig(binId, sensorConfig) {
    try {
      console.log(`🔧 Updating sensor config for bin ${binId}:`, sensorConfig);
      
      const binDoc = doc(db, 'smart-bins', binId);
      const updates = {
        sensors_enabled: sensorConfig,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(binDoc, updates, { merge: true });
      console.log(`✅ Updated sensor config for bin ${binId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating sensor config for bin ${binId}:`, error);
      throw error;
    }
  }

  // Get single bins from Firestore (filtered by type)
  static async getSingleBins() {
    try {
      console.log('📦 Fetching single bins from Firestore...');
      
      // Get all bins and filter for single bins
      const allBins = await this.getSmartBins();
      const singleBins = allBins.filter(bin => 
        bin.type === 'single' || 
        bin.bin_type === 'single' || 
        (!bin.type && !bin.bin_type) // Default to single if no type specified
      );
      
      console.log(`📦 Retrieved ${singleBins.length} single bins from ${allBins.length} total bins`);
      return singleBins;
    } catch (error) {
      console.error('❌ Error fetching single bins:', error);
      return [];
    }
  }

  // Save compartment to Firebase
  static async saveCompartment(compartmentData) {
    try {
      const compartmentsRef = ref(database, 'compartments');
      
      if (compartmentData.id) {
        // Update existing compartment
        const compartmentRef = ref(database, `compartments/${compartmentData.id}`);
        await set(compartmentRef, {
          ...compartmentData,
          updatedAt: new Date().toISOString()
        });
        return { ...compartmentData, updatedAt: new Date().toISOString() };
      } else {
        // Create new compartment
        const newCompartmentRef = push(compartmentsRef);
        const newCompartmentData = {
          ...compartmentData,
          id: newCompartmentRef.key,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await set(newCompartmentRef, newCompartmentData);
        return newCompartmentData;
      }
    } catch (error) {
      console.error('Error saving compartment:', error);
      throw error;
    }
  }

  // Save alert to Firebase
  static async saveAlert(alertData) {
    try {
      const alertsRef = ref(database, 'alerts');
      const newAlertRef = push(alertsRef);
      const newAlertData = {
        ...alertData,
        id: newAlertRef.key,
        createdAt: new Date().toISOString(),
        acknowledged: false
      };
      await set(newAlertRef, newAlertData);
      return newAlertData;
    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  }

  // Update alert acknowledgment
  static async acknowledgeAlert(alertId) {
    try {
      const alertRef = ref(database, `alerts/${alertId}`);
      await set(alertRef, {
        acknowledged: true,
        acknowledgedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Delete smart bin
  static async deleteSmartBin(binId) {
    try {
      const binRef = ref(database, `smart-bins/${binId}`);
      await set(binRef, null);
    } catch (error) {
      console.error('Error deleting smart bin:', error);
      throw error;
    }
  }

  // Delete compartment
  static async deleteCompartment(compartmentId) {
    try {
      const compartmentRef = ref(database, `compartments/${compartmentId}`);
      await set(compartmentRef, null);
    } catch (error) {
      console.error('Error deleting compartment:', error);
      throw error;
    }
  }

  // Helper function to create test sensor data (for development/testing)
  static async createTestSensorData() {
    try {
      console.log('🧪 Creating test sensor data...');
      
      const devices = [
        { id: 'sortyx-sensor-two', battery: 85, distance: 25, tilt: 2 },
        { id: 'plaese-work', battery: 92, distance: 55, tilt: 1 },
        { id: 'sortyx-sensor-one', battery: 78, distance: 35, tilt: 0 }
      ];
      
      for (const device of devices) {
        const sensorRef = ref(database, `sensor-data-${device.id}`);
        const testData = {
          battery: device.battery,
          distance: device.distance,
          tilt: device.tilt,
          timestamp: new Date().toISOString(),
          deviceId: device.id,
          receivedAt: new Date().toISOString(),
          created_by: 'test-system'
        };
        
        await push(sensorRef, testData);
        console.log(`✅ Added test data for ${device.id}`);
      }
      
      console.log('🎉 Test sensor data created successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Error creating test sensor data:', error);
      throw error;
    }
  }
}

export default FirebaseService;