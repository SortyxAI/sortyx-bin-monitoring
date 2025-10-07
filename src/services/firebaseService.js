import { database, db } from '../config/firebase';
import { ref, onValue, push, set, get, query, orderByChild, limitToLast, orderByKey, child } from 'firebase/database';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, orderBy, limit, where, query as firestoreQuery } from 'firebase/firestore';

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
      
      // No bins found in Firestore
      console.log('⚠️ No smart bins found in Firestore smart-bins collection');
      return [];
    } catch (error) {
      console.error('❌ Error fetching smart bins:', error);
      return [];
    }
  }

  // Get compartments from Firestore
  static async getCompartments() {
    try {
      console.log('📦 Fetching compartments from Firestore...');
      
      // Get compartments from Firestore
      const compartmentsCollection = collection(db, 'compartments');
      const compartmentsSnapshot = await getDocs(compartmentsCollection);
      
      if (!compartmentsSnapshot.empty) {
        const compartments = [];
        
        for (const compartmentDoc of compartmentsSnapshot.docs) {
          const compartmentData = { id: compartmentDoc.id, ...compartmentDoc.data() };
          
          // If compartment has a device_id or sensorId, get live sensor data
          const deviceId = compartmentData.device_id || compartmentData.sensorId || compartmentData.deviceId;
          if (deviceId) {
            console.log(`🔄 Getting live data for compartment ${compartmentData.label} with device ${deviceId}`);
            const liveSensorData = await this.getLatestSensorData(deviceId);
            
            if (liveSensorData) {
              // Merge live sensor data with compartment configuration
              compartmentData.current_fill = liveSensorData.fillLevel || 0;
              compartmentData.fillLevel = liveSensorData.fillLevel || 0;
              compartmentData.battery_level = liveSensorData.battery || 0;
              compartmentData.distance = liveSensorData.distance || 0;
              compartmentData.temperature = liveSensorData.temperature || 0;
              compartmentData.humidity = liveSensorData.humidity || 0;
              compartmentData.last_sensor_update = new Date().toISOString();
              
              console.log(`✅ Updated compartment ${compartmentData.label} with live data`);
            }
          }
          
          compartments.push(compartmentData);
        }
        
        console.log(`📦 Retrieved ${compartments.length} compartments from Firestore`);
        return compartments;
      }
      
      // No compartments found in Firestore
      console.log('⚠️ No compartments found in Firestore compartments collection');
      return [];
    } catch (error) {
      console.error('❌ Error fetching compartments:', error);
      return [];
    }
  }

  // Get alerts from Firestore
  static async getAlerts() {
    try {
      console.log('🔔 Fetching alerts from Firestore...');
      
      // Get alerts from Firestore
      const alertsCollection = collection(db, 'alerts');
      const alertsSnapshot = await getDocs(alertsCollection);
      
      if (!alertsSnapshot.empty) {
        const alerts = alertsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`🔔 Retrieved ${alerts.length} alerts from Firestore`);
        return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      // No alerts found in Firestore
      console.log('⚠️ No alerts found in Firestore alerts collection');
      return [];
    } catch (error) {
      console.error('❌ Error fetching alerts:', error);
      return [];
    }
  }

  // Generate alerts based on bin sensor data
  static async generateAlertsForBins() {
    try {
      console.log('🔍 Checking bins for alert conditions...');
      
      // Get all bins (smart and single)
      const [smartBins, singleBins, compartments] = await Promise.all([
        this.getSmartBins(),
        this.getSingleBins(),
        this.getCompartments()
      ]);
      
      const allBins = [...smartBins, ...singleBins];
      const generatedAlerts = [];
      
      // Check each bin for alert conditions
      for (const bin of allBins) {
        // Skip multi-compartment bins - only check their individual compartments
        if (bin.type === 'smart' && bin.compartment_count > 0) {
          console.log(`⏭️ Skipping multi-compartment bin "${bin.name}" - will check compartments separately`);
          continue;
        }
        
        // Fill level alert (only for single bins and smart bins without compartments)
        if (bin.current_fill !== undefined && bin.current_fill !== null && bin.current_fill >= (bin.fill_threshold || 80)) {
          const alert = await this.saveAlert({
            binId: bin.id,
            binName: bin.name,
            binType: bin.type || 'single',
            type: 'fill_level',
            severity: bin.current_fill >= 90 ? 'critical' : 'high',
            message: `${bin.name} is ${bin.current_fill}% full and needs emptying`,
            threshold: bin.fill_threshold || 80,
            currentValue: bin.current_fill,
            unit: '%'
          });
          generatedAlerts.push(alert);
        }
        
        // Battery low alert
        if (bin.battery_level && bin.battery_level <= (bin.battery_threshold || 20)) {
          const alert = await this.saveAlert({
            binId: bin.id,
            binName: bin.name,
            binType: bin.type || 'single',
            type: 'battery_low',
            severity: bin.battery_level <= 10 ? 'critical' : 'medium',
            message: `${bin.name} battery level is ${bin.battery_level}%`,
            threshold: bin.battery_threshold || 20,
            currentValue: bin.battery_level,
            unit: '%'
          });
          generatedAlerts.push(alert);
        }
        
        // Temperature alert
        if (bin.temperature && bin.temperature >= (bin.temp_threshold || 50)) {
          const alert = await this.saveAlert({
            binId: bin.id,
            binName: bin.name,
            binType: bin.type || 'single',
            type: 'temperature_high',
            severity: bin.temperature >= 60 ? 'critical' : 'high',
            message: `${bin.name} temperature is ${bin.temperature}°C`,
            threshold: bin.temp_threshold || 50,
            currentValue: bin.temperature,
            unit: '°C'
          });
          generatedAlerts.push(alert);
        }
      }
      
      // Check compartments for multi-compartment bins
      for (const compartment of compartments) {
        // Only alert if compartment has actual sensor data (not just default 0)
        if (compartment.current_fill !== undefined && 
            compartment.current_fill !== null && 
            compartment.current_fill > 0 && 
            compartment.current_fill >= (compartment.fill_threshold || 90)) {
          const alert = await this.saveAlert({
            binId: compartment.smartBinId,
            compartmentId: compartment.id,
            binName: compartment.label,
            binType: 'compartment',
            type: 'fill_level',
            severity: compartment.current_fill >= 95 ? 'critical' : 'high',
            message: `Compartment "${compartment.label}" is ${compartment.current_fill}% full`,
            threshold: compartment.fill_threshold || 90,
            currentValue: compartment.current_fill,
            unit: '%'
          });
          generatedAlerts.push(alert);
        }
      }
      
      console.log(`✅ Generated ${generatedAlerts.length} new alerts`);
      return generatedAlerts;
    } catch (error) {
      console.error('❌ Error generating alerts:', error);
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
          type: 'smart',
          bin_type: 'smart',
          updatedAt: new Date().toISOString()
        };
        await setDoc(binDoc, updatedData);
        console.log('✅ Updated existing smart bin:', updatedData);
        return updatedData;
      } else {
        // Create new smart bin with proper structure
        const newBinData = {
          ...binData,
          id: Date.now().toString(), // Simple ID generation
          type: 'smart',
          bin_type: 'smart',
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
        console.log('✅ Created new smart bin:', newBinData);
        return newBinData;
      }
    } catch (error) {
      console.error('❌ Error saving smart bin:', error);
      throw error;
    }
  }

  // Save single bin to Firestore (SEPARATE COLLECTION)
  static async saveSingleBin(binData) {
    try {
      console.log('💾 Saving single bin to Firestore:', binData);
      
      // Use separate collection for single bins
      const binsCollection = collection(db, 'single-bins');
      
      if (binData.id) {
        // Update existing bin
        const binDoc = doc(db, 'single-bins', binData.id);
        const updatedData = {
          ...binData,
          type: 'single',
          bin_type: 'single',
          updatedAt: new Date().toISOString()
        };
        await setDoc(binDoc, updatedData);
        console.log('✅ Updated existing single bin:', updatedData);
        return updatedData;
      } else {
        // Create new single bin with proper structure
        const newBinData = {
          ...binData,
          id: Date.now().toString(),
          type: 'single',
          bin_type: 'single',
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
        
        const newBinDoc = doc(db, 'single-bins', newBinData.id);
        await setDoc(newBinDoc, newBinData);
        console.log('✅ Created new single bin:', newBinData);
        return newBinData;
      }
    } catch (error) {
      console.error('❌ Error saving single bin:', error);
      throw error;
    }
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

  // Get single bins from Firestore (SEPARATE COLLECTION) with live sensor data
  static async getSingleBins() {
    try {
      console.log('📦 Fetching single bins from Firestore...');
      
      // Get bins from separate single-bins collection
      const binsCollection = collection(db, 'single-bins');
      const binsSnapshot = await getDocs(binsCollection);
      
      if (!binsSnapshot.empty) {
        const bins = [];
        
        for (const binDoc of binsSnapshot.docs) {
          const binData = { id: binDoc.id, ...binDoc.data() };
          
          // If bin has a device_id, get live sensor data
          if (binData.device_id || binData.deviceId) {
            const deviceId = binData.device_id || binData.deviceId;
            console.log(`🔄 Getting live data for single bin ${binData.name} with device ${deviceId}`);
            const liveSensorData = await this.getLatestSensorData(deviceId);
            
            if (liveSensorData) {
              // Merge live sensor data with bin configuration
              binData.current_fill = liveSensorData.fillLevel || 0;
              binData.fillLevel = liveSensorData.fillLevel || 0;
              binData.battery_level = liveSensorData.battery || 0;
              binData.battery = liveSensorData.battery || 0;
              binData.distance = liveSensorData.distance || 0;
              binData.temperature = liveSensorData.temperature || 0;
              binData.humidity = liveSensorData.humidity || 0;
              binData.air_quality = liveSensorData.airQuality || 0;
              binData.odour_level = liveSensorData.odourLevel || 0;
              binData.current_sensor_data = liveSensorData;
              binData.last_sensor_update = new Date().toISOString();
              binData.lastUpdate = new Date().toISOString();
              
              console.log(`✅ Updated single bin ${binData.name} with live data:`, {
                fillLevel: liveSensorData.fillLevel,
                battery: liveSensorData.battery,
                distance: liveSensorData.distance
              });
            }
          }
          
          bins.push(binData);
        }
        
        console.log(`📦 Retrieved ${bins.length} single bins from Firestore`);
        return bins;
      }
      
      console.log('⚠️ No single bins found in Firestore');
      return [];
    } catch (error) {
      console.error('❌ Error fetching single bins:', error);
      return [];
    }
  }

  // Save compartment to Firestore
  static async saveCompartment(compartmentData) {
    try {
      console.log('💾 Saving compartment to Firestore:', compartmentData);
      
      if (compartmentData.id) {
        // Update existing compartment
        const compartmentDoc = doc(db, 'compartments', compartmentData.id);
        const updatedData = {
          ...compartmentData,
          updatedAt: new Date().toISOString()
        };
        await setDoc(compartmentDoc, updatedData);
        console.log('✅ Updated existing compartment:', updatedData);
        return updatedData;
      } else {
        // Create new compartment
        const newCompartmentData = {
          ...compartmentData,
          id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure default values
          current_fill: 0,
          fillLevel: 0,
          sensors_enabled: compartmentData.sensors_enabled || {
            fill_level: true,
            temperature: false,
            humidity: false,
            weight: false,
            odour_detection: false,
            lid_sensor: false
          }
        };
        
        const newCompartmentDoc = doc(db, 'compartments', newCompartmentData.id);
        await setDoc(newCompartmentDoc, newCompartmentData);
        console.log('✅ Created new compartment:', newCompartmentData);
        return newCompartmentData;
      }
    } catch (error) {
      console.error('❌ Error saving compartment:', error);
      throw error;
    }
  }

  // Delete compartment from Firestore
  static async deleteCompartment(compartmentId) {
    try {
      console.log(`🗑️ Deleting compartment ${compartmentId} from Firestore...`);
      
      // Delete the compartment document
      const compartmentDoc = doc(db, 'compartments', compartmentId);
      await deleteDoc(compartmentDoc);
      
      // Delete all alerts associated with this compartment
      const alertsCollection = collection(db, 'alerts');
      const alertsQuery = firestoreQuery(
        alertsCollection,
        where('compartmentId', '==', compartmentId)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      
      const alertDeletePromises = alertsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(alertDeletePromises);
      
      console.log(`✅ Deleted compartment ${compartmentId} and ${alertsSnapshot.size} alerts`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting compartment ${compartmentId}:`, error);
      throw error;
    }
  }

  // Get compartments for a specific smart bin
  static async getCompartmentsByBinId(smartBinId) {
    try {
      console.log(`📦 Fetching compartments for smart bin ${smartBinId}...`);
      
      const compartmentsCollection = collection(db, 'compartments');
      const q = firestoreQuery(
        compartmentsCollection,
        where('smartBinId', '==', smartBinId)
      );
      
      const querySnapshot = await getDocs(q);
      const compartments = [];
      
      for (const compartmentDoc of querySnapshot.docs) {
        const compartmentData = { id: compartmentDoc.id, ...compartmentDoc.data() };
        
        // Get live sensor data if device is configured
        const deviceId = compartmentData.device_id || compartmentData.sensorId || compartmentData.deviceId;
        if (deviceId) {
          const liveSensorData = await this.getLatestSensorData(deviceId);
          if (liveSensorData) {
            compartmentData.current_fill = liveSensorData.fillLevel || 0;
            compartmentData.fillLevel = liveSensorData.fillLevel || 0;
            compartmentData.battery_level = liveSensorData.battery || 0;
            compartmentData.distance = liveSensorData.distance || 0;
            compartmentData.last_sensor_update = new Date().toISOString();
          }
        }
        
        compartments.push(compartmentData);
      }
      
      console.log(`📦 Retrieved ${compartments.length} compartments for bin ${smartBinId}`);
      return compartments;
    } catch (error) {
      console.error(`❌ Error fetching compartments for bin ${smartBinId}:`, error);
      return [];
    }
  }

  // Save alert to Firestore
  static async saveAlert(alertData) {
    try {
      console.log('💾 Saving alert to Firestore:', alertData);
      
      const {
        binId,
        compartmentId = null,
        binName,
        binType,
        type,
        severity,
        message,
        threshold = null,
        currentValue = null,
        unit = null
      } = alertData;
      
      // Check if similar alert already exists (prevent duplicates)
      const alertsCollection = collection(db, 'alerts');
      const q = firestoreQuery(
        alertsCollection, 
        where('binId', '==', binId),
        where('type', '==', type),
        where('acknowledged', '==', false)
      );
      const existingAlerts = await getDocs(q);
      
      // If unacknowledged alert of same type exists, don't create duplicate
      if (!existingAlerts.empty) {
        console.log('⚠️ Similar unacknowledged alert already exists, skipping...');
        return existingAlerts.docs[0].data();
      }
      
      // Create new alert
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const alert = {
        binId,
        compartmentId,
        binName,
        binType,
        type,
        severity,
        message,
        threshold,
        currentValue,
        unit,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null
      };
      
      const alertDocRef = doc(db, 'alerts', alertId);
      await setDoc(alertDocRef, alert);
      
      console.log('✅ Alert saved successfully:', alertId);
      return { id: alertId, ...alert };
    } catch (error) {
      console.error('❌ Error saving alert:', error);
      throw error;
    }
  }

  // Update alert acknowledgment in Firestore
  static async acknowledgeAlert(alertId, acknowledgedBy = 'system') {
    try {
      console.log('✅ Acknowledging alert:', alertId);
      
      const alertDocRef = doc(db, 'alerts', alertId);
      await updateDoc(alertDocRef, {
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy
      });
      
      console.log('✅ Alert acknowledged successfully');
      return true;
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
      throw error;
    }
  }

  // Delete old acknowledged alerts (cleanup)
  static async deleteOldAlerts(daysOld = 7) {
    try {
      console.log(`🗑️ Deleting alerts older than ${daysOld} days...`);
      
      const alertsCollection = collection(db, 'alerts');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = firestoreQuery(
        alertsCollection,
        where('acknowledged', '==', true),
        where('acknowledgedAt', '<=', cutoffDate.toISOString())
      );
      
      const oldAlerts = await getDocs(q);
      const deletePromises = oldAlerts.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${oldAlerts.size} old alerts`);
      return oldAlerts.size;
    } catch (error) {
      console.error('❌ Error deleting old alerts:', error);
      throw error;
    }
  }

  // Delete smart bin from Firestore
  static async deleteSmartBin(binId) {
    try {
      console.log(`🗑️ Deleting smart bin ${binId} from Firestore...`);
      
      // Delete the bin document
      const binDoc = doc(db, 'smart-bins', binId);
      await deleteDoc(binDoc);
      
      // Delete all compartments associated with this bin
      const compartmentsCollection = collection(db, 'compartments');
      const compartmentsQuery = firestoreQuery(
        compartmentsCollection,
        where('smartBinId', '==', binId)
      );
      const compartmentsSnapshot = await getDocs(compartmentsQuery);
      
      const compartmentDeletePromises = compartmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(compartmentDeletePromises);
      
      // Delete all alerts associated with this bin
      const alertsCollection = collection(db, 'alerts');
      const alertsQuery = firestoreQuery(
        alertsCollection,
        where('binId', '==', binId)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      
      const alertDeletePromises = alertsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(alertDeletePromises);
      
      console.log(`✅ Deleted smart bin ${binId}, ${compartmentsSnapshot.size} compartments, and ${alertsSnapshot.size} alerts`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting smart bin ${binId}:`, error);
      throw error;
    }
  }

  // Delete single bin from Firestore
  static async deleteSingleBin(binId) {
    try {
      console.log(`🗑️ Deleting single bin ${binId} from Firestore...`);
      
      // Delete the bin document
      const binDoc = doc(db, 'single-bins', binId);
      await deleteDoc(binDoc);
      
      // Delete all alerts associated with this bin
      const alertsCollection = collection(db, 'alerts');
      const alertsQuery = firestoreQuery(
        alertsCollection,
        where('binId', '==', binId)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      
      const alertDeletePromises = alertsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(alertDeletePromises);
      
      console.log(`✅ Deleted single bin ${binId} and ${alertsSnapshot.size} alerts`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting single bin ${binId}:`, error);
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