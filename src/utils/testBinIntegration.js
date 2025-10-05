// Test utility to verify bin and sensor data integration
import { FirebaseService } from '../services/firebaseService.js';

export async function testBinIntegration() {
  console.log('🧪 Testing Bin and Sensor Data Integration...');
  
  try {
    // Test 1: Get sensor data for known devices
    console.log('\n📡 Test 1: Getting sensor data...');
    const sensorData1 = await FirebaseService.getLatestSensorData('sortyx-sensor-two');
    const sensorData2 = await FirebaseService.getLatestSensorData('plaese-work');
    
    console.log('Sensor Data 1 (sortyx-sensor-two):', sensorData1);
    console.log('Sensor Data 2 (plaese-work):', sensorData2);
    
    // Test 2: Get all bins
    console.log('\n📦 Test 2: Getting all bins...');
    const smartBins = await FirebaseService.getSmartBins();
    const singleBins = await FirebaseService.getSingleBins();
    
    console.log('Smart Bins:', smartBins);
    console.log('Single Bins:', singleBins);
    
    // Test 3: Verify bin data structure
    console.log('\n🔍 Test 3: Verifying bin data structure...');
    [...smartBins, ...singleBins].forEach(bin => {
      console.log(`Bin ${bin.name}:`, {
        id: bin.id,
        deviceId: bin.deviceId || bin.device_id,
        current_fill: bin.current_fill,
        fillLevel: bin.fillLevel,
        battery: bin.battery || bin.battery_level,
        sensors_enabled: bin.sensors_enabled,
        type: bin.type || bin.bin_type
      });
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test in browser console with: testBinIntegration()
window.testBinIntegration = testBinIntegration;