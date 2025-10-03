// Test script to check Firebase data structure
import { FirebaseService } from './firebaseService.js';

// Test function to check data
export const testFirebaseData = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test 1: Check if device collection exists
    const deviceId = 'plaese-work';
    console.log(`Testing device: ${deviceId}`);
    
    // Test 2: Try to get data directly
    const data = await FirebaseService.getLatestSensorData(deviceId);
    console.log('Retrieved data:', data);
    
    return data;
  } catch (error) {
    console.error('Test failed:', error);
    return null;
  }
};