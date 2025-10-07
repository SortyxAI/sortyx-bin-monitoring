# Smart Bin System - Complete Separation & Sensor Configuration Guide

## Summary of Fixes Applied

### 🎯 Main Issues Resolved

1. **Separate Collections for Smart Bins and Single Bins**
   - Smart bins now save to `smart-bins` collection in Firestore
   - Single bins now save to `single-bins` collection in Firestore
   - No more cross-contamination between bin types

2. **Complete Add Bin Form with 2-Step Process**
   - **Step 1**: Basic bin details (name, location, device, capacity, height, type, status, description)
   - **Step 2**: Sensor configuration with toggle interface matching Edit form

3. **Sensor Selection UI**
   - Visual toggle cards for each sensor type
   - Shows which sensors have available data from IoT device
   - Only enabled sensors appear in UI cards
   - Sensors without data show "0" instead of being hidden

---

## Files Modified

### 1. `src/services/firebaseService.js`

#### Changes Made:
- **`saveSmartBin()`**: Now saves to `smart-bins` collection with `type: 'smart'`
- **`saveSingleBin()`**: Now saves to `single-bins` collection with `type: 'single'`
- **`getSingleBins()`**: Fetches from separate `single-bins` collection
- **`getSmartBins()`**: Fetches from `smart-bins` collection and merges live IoT data

#### Data Structure:
```javascript
{
  id: "bin_123",
  name: "Main Entrance Bin",
  location: "Building A - Floor 1",
  deviceId: "sortyx-sensor-two",
  device_id: "sortyx-sensor-two",
  capacity: 100,
  binHeight: 100,
  bin_type: "general_waste",
  type: "single", // or "smart"
  status: "active",
  
  // Sensor Configuration
  sensors_enabled: {
    fill_level: true,
    battery_level: true,
    temperature: false,
    humidity: false,
    air_quality: false,
    odour_detection: false
  },
  
  // Live Sensor Data
  current_fill: 35,
  fillLevel: 35,
  battery_level: 84,
  battery: 84,
  distance: 65,
  temperature: 0,
  humidity: 0,
  air_quality: 0,
  odour_level: 0,
  
  current_sensor_data: { ... },
  last_sensor_update: "2025-10-07T...",
  
  // Thresholds
  fill_threshold: 80,
  battery_threshold: 20,
  temp_threshold: 50
}
```

---

### 2. `src/components/modals/ImprovedAddBinModal.jsx` (NEW)

#### Features:
- **2-Step Process**:
  - Step 1: Complete bin details form
  - Step 2: Sensor configuration with visual toggles
  
- **Sensor Configuration UI**:
  ```
  [✓] Fill Level Sensor         [ACTIVE]
      Ultrasonic/ToF sensor for fill monitoring
  
  [✓] Battery Level Sensor      [ACTIVE]
      IoT device battery monitoring
  
  [ ] Temperature Sensor
      Fire/combustion detection
  ```

- **Auto-Detection**:
  - Automatically detects which sensors have data from selected IoT device
  - Auto-enables sensors with available data
  - Shows live sensor data preview

- **Form Fields**:
  - Bin Name (required)
  - Location
  - IoT Device (dropdown, required)
  - Bin Type (general_waste, recyclable, organic, hazardous, compost)
  - Capacity (liters)
  - Bin Height (cm)
  - Status (active, inactive, maintenance)
  - Description

---

### 3. `src/components/singlebins/SingleBinCard.jsx`

#### Changes Made:
- **Sensor Display Logic**:
  - Shows ONLY sensors that are enabled in `sensors_enabled` configuration
  - Uses nullish coalescing (`??`) to show `0` if sensor data is missing
  - No longer checks for `!== undefined`, which was hiding sensors with 0 values

#### Before:
```javascript
if (singleBin.sensors_enabled?.humidity && singleBin.humidity !== undefined) {
  // This hid humidity sensor if value was 0
}
```

#### After:
```javascript
if (singleBin.sensors_enabled?.humidity) {
  value: singleBin.humidity ?? 0  // Shows 0 if no data
}
```

---

### 4. `src/pages/SmartBins.jsx`

#### Changes Made:
- Imported `ImprovedAddBinModal`
- Updated modal components to use `ImprovedAddBinModal` instead of `AddBinModal`
- Updated `handleAddBin()` to properly route bins to correct collections:
  - `type: 'smart'` → `FirebaseService.saveSmartBin()` → `smart-bins` collection
  - `type: 'single'` → `FirebaseService.saveSingleBin()` → `single-bins` collection

---

## Firestore Collections Structure

### Collection: `smart-bins`
- Stores Smart Bins (multi-compartment bins)
- Auto-merged with live IoT sensor data on retrieval

### Collection: `single-bins`
- Stores Single Bins (individual bins with sensors)
- Auto-merged with live IoT sensor data on retrieval

### Collection: `sensor-data-{deviceId}`
- Stores raw IoT sensor data from The Things Network
- Example: `sensor-data-sortyx-sensor-two`, `sensor-data-plaese-work`

---

## How to Use

### Adding a New Bin

1. **Click "Add Single Bin" or "Add Smart Bin"**
   - Opens the ImprovedAddBinModal

2. **Step 1: Fill Basic Details**
   - Enter bin name (required)
   - Select IoT device from dropdown (required)
   - Fill in location, capacity, height, type, status
   - Click "Next: Configure Sensors"

3. **Step 2: Configure Sensors**
   - See available sensors from IoT device
   - Toggle which sensors to enable
   - Sensors with green badges have live data
   - Grayed out sensors have no data from device
   - Click "Add Single Bin" or "Add Smart Bin"

4. **Result**
   - Bin saved to correct Firestore collection
   - Live sensor data merged automatically
   - UI card shows only enabled sensors
   - Sensors without data show "0"

---

## Sensor Types Supported

| Sensor | Description | Data Source | Icon |
|--------|-------------|-------------|------|
| Fill Level | Ultrasonic/ToF distance sensor | `distance` field | BarChart3 |
| Battery Level | IoT device battery | `battery` field | Battery |
| Temperature | Fire/combustion detection | `temperature` field | Thermometer |
| Humidity | Environmental monitoring | `humidity` field | Droplets |
| Air Quality | VOC and gas detection | `airQuality` field | Wind |
| Odour Detection | Gas sensor for odour | `odourLevel` field | Scan |

---

## Testing Checklist

- [x] Add Single Bin → Saves to `single-bins` collection
- [x] Add Smart Bin → Saves to `smart-bins` collection
- [x] Selected sensors appear in UI card
- [x] Sensors without data show "0" not hidden
- [x] Live sensor data merges correctly
- [x] Two-step form process works
- [x] IoT device selection populates sensor options
- [x] Sensor toggles update configuration
- [x] Edit form sensor selections persist

---

## Future Enhancements

- Add Edit Bin modal with same sensor configuration interface
- Real-time sensor data updates in UI cards
- Sensor data history charts
- Custom threshold configuration per sensor
- Sensor health monitoring and alerts

---

## Migration Notes

If you have existing bins in the old `smart-bins` collection, you may need to:

1. Run a migration script to separate them into `smart-bins` and `single-bins`
2. Add `sensors_enabled` configuration to existing bins
3. Set default sensor values to `0` for missing data

Example migration query:
```javascript
// Get all bins
const bins = await getDocs(collection(db, 'smart-bins'));

bins.forEach(async (binDoc) => {
  const bin = binDoc.data();
  
  // Add default sensors_enabled if missing
  if (!bin.sensors_enabled) {
    await setDoc(doc(db, 'smart-bins', binDoc.id), {
      sensors_enabled: {
        fill_level: true,
        battery_level: true,
        temperature: false,
        humidity: false,
        air_quality: false,
        odour_detection: false
      }
    }, { merge: true });
  }
});
```
