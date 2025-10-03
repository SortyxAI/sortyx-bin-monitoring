import { db } from '../config/firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

// Debug function to explore Firebase data structure
async function debugFirebaseData() {
  console.log('🔍 Starting Firebase Data Debug...');
  
  try {
    // First, let's see what's at the root level
    const rootRef = ref(database, '/');
    const snapshot = await get(rootRef);
    const data = snapshot.val();
    
    if (data) {
      console.log('� All collections in Firebase root:', Object.keys(data));
      
      // Check each collection for sensor data
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          const subKeys = Object.keys(value);
          console.log(`\n📁 Collection "${key}": ${subKeys.length} entries`);
          console.log(`   🔑 Sample keys:`, subKeys.slice(0, 5));
          
          // Show structure of first entry
          if (subKeys.length > 0) {
            const firstEntry = value[subKeys[0]];
            if (typeof firstEntry === 'object') {
              console.log(`   📋 First entry keys:`, Object.keys(firstEntry));
              
              // If it looks like sensor data, show more details
              if (firstEntry.battery !== undefined || 
                  firstEntry.distance !== undefined || 
                  firstEntry.sensorData !== undefined ||
                  firstEntry.uplink_message !== undefined) {
                console.log(`   🎯 SENSOR DATA FOUND! Sample:`, firstEntry);
              }
            }
          }
        }
      }
      
    } else {
      console.log('❌ No data found in Firebase database');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Add button to create test data
function addTestDataButton() {
  if (typeof window !== 'undefined' && !window.testDataButtonAdded) {
    window.testDataButtonAdded = true;
    
    // Add to window object for console access
    window.createTestSensorData = async () => {
      const { FirebaseService } = await import('../services/firebaseService');
      return await FirebaseService.createTestSensorData();
    };
    
    console.log('📋 To create test sensor data, run: window.createTestSensorData()');
  }
}

// Run the debug function immediately
setTimeout(() => {
  debugFirebaseData();
  addTestDataButton();
}, 1000);

export { debugFirebaseData };