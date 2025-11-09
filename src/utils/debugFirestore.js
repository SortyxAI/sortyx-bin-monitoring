import { db } from '../config/firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

// Debug function to explore FIRESTORE data structure
async function debugFirestoreData() {
  console.log('🔍 Starting Firestore Data Debug...');
  
  try {
    // Check known sensor collections in Firestore
    const sensorCollections = [
      'all-sensor-data',
      'sensor-data-plaese-work',
      'sensor-data-sortyx-sensor-two',
      'sensor-data-bin-sensor-001',
      'sensor-data-bin-sensor-002'
    ];
    
    for (const collectionName of sensorCollections) {
      try {
        console.log(`\n📁 Checking Firestore collection: ${collectionName}`);
        
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, orderBy('receivedAt', 'desc'), limit(3));
        const snapshot = await getDocs(q);
        
        console.log(`   📊 Found ${snapshot.docs.length} documents`);
        
        if (!snapshot.empty) {
          snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`   📋 Document ${index + 1} (${doc.id}):`, data);
            
            // Check if it has sensor data structure
            if (data.sensorData) {
              console.log(`   🎯 SENSOR DATA FOUND! Battery: ${data.sensorData.battery}, Distance: ${data.sensorData.distance}`);
            }
          });
        }
        
      } catch (error) {
        console.log(`   ❌ Error accessing ${collectionName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Firestore debug failed:', error);
  }
}

// ✅ CHANGED: Expose to window for manual DevTools access only
// No longer auto-executes on import
if (typeof window !== 'undefined') {
  window.debugFirestoreData = debugFirestoreData;
  console.log('🔧 DevTools: debugFirestoreData() is available in the console');
}

export { debugFirestoreData };