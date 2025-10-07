# Multi-Compartment Bins - Complete Guide

## Overview

Multi-compartment bins (Smart Bins) can have multiple compartments, each with its own sensors and IoT device. This guide explains how the compartment system works and how to add/manage compartments.

---

## Firestore Collections Structure

### Collection: `smart-bins`
Stores the parent Smart Bin (container)
```javascript
{
  id: "smartbin_123",
  name: "Main Entrance Smart Bin",
  location: "Building A - Main Entrance",
  description: "Multi-compartment bin for recycling",
  status: "active",
  type: "smart",
  created_at: "2025-10-07T...",
  sensors_enabled: {
    temperature: true,
    humidity: true,
    air_quality: false,
    battery_level: true
  },
  temperature: 24,
  humidity: 65,
  battery_level: 78
}
```

### Collection: `compartments`
Stores individual compartments belonging to Smart Bins
```javascript
{
  id: "comp_123",
  smartBinId: "smartbin_123",          // Parent bin ID
  smartbin_id: "smartbin_123",         // Legacy compatibility
  label: "Recyclable Plastics",
  bin_type: "recyclable",
  capacity: 50,
  fill_threshold: 90,
  
  // IoT Device Configuration
  device_id: "sortyx-sensor-two",
  sensorId: "sortyx-sensor-two",       // Legacy compatibility
  deviceId: "sortyx-sensor-two",       // Alternative
  
  // Sensor Configuration
  sensors_enabled: {
    fill_level: true,
    weight: false,
    odour_detection: false,
    lid_sensor: false
  },
  
  // Live Sensor Data (merged from IoT)
  current_fill: 35,
  fillLevel: 35,
  battery_level: 84,
  distance: 65,
  temperature: 0,
  weight: 0,
  odour_level: 0,
  lid_open: false,
  
  last_sensor_update: "2025-10-07T...",
  created_at: "2025-10-07T...",
  updated_at: "2025-10-07T..."
}
```

---

## How to Add a Compartment

### Step 1: Create a Smart Bin First
1. Click "Add SmartBin" button
2. Fill in Smart Bin details:
   - Name
   - Location
   - Description
   - Status
3. Configure Smart Bin level sensors (temperature, humidity, air quality, battery)
4. Save the Smart Bin

### Step 2: Add Compartments to Smart Bin
1. Find your Smart Bin in the list
2. Expand the Smart Bin card
3. Click "Add Compartment" button
4. Fill in compartment details:

#### Basic Details:
- **Label**: Name of the compartment (e.g., "Recyclable Plastics", "General Waste")
- **Bin Type**: 
  - `general_waste` - General waste
  - `recyclable` - Recyclable materials
  - `organic` - Organic/compost waste
  - `hazardous` - Hazardous materials
  - `compost` - Composting waste
- **Capacity**: Volume in liters (e.g., 50L)
- **Fill Threshold**: Alert threshold percentage (default: 90%)

#### IoT Device:
- **Device ID**: Select IoT sensor device for this compartment
  - Each compartment can have its own sensor
  - Or multiple compartments can share one sensor (not recommended)

#### Sensor Configuration:
Toggle which sensors are enabled for this compartment:
- ✅ **Fill Level Sensor** - Ultrasonic/ToF distance sensor
- ⬜ **Weight Sensor** - Load cell weight measurement
- ⬜ **Odour Detection Sensor** - Gas sensor for smell
- ⬜ **Lid Sensor** - Accelerometer for lid open/close

5. Click "Save Compartment"

---

## Compartment Sensor Types

| Sensor | Description | Data Source | Icon |
|--------|-------------|-------------|------|
| Fill Level | Distance measurement for fill calculation | `distance` field | BarChart3 |
| Weight | Load cell weight in kg | `weight` field | Weight |
| Odour Detection | Gas sensor odour level | `odourLevel` field | Scan |
| Lid Sensor | Open/close status | `lidOpen` field | DoorOpen |

---

## Data Flow

### 1. Create Compartment
```
User fills form → handleSaveCompartment() → FirebaseService.saveCompartment()
→ Saves to Firestore `compartments` collection with smartBinId reference
```

### 2. Display Compartments
```
loadData() → FirebaseService.getCompartments()
→ Fetches all compartments from Firestore
→ For each compartment with device_id:
  → getLatestSensorData(device_id)
  → Merges live IoT data
→ Returns compartments with live data
```

### 3. Display in UI
```
SmartBinCard component
→ Gets compartments filtered by smartBinId
→ Maps compartments to CompartmentCard
→ Shows live sensor data for enabled sensors only
→ Sensors without data show "0"
```

---

## API Methods

### FirebaseService.saveCompartment(compartmentData)
Saves or updates a compartment in Firestore.

**Parameters:**
```javascript
{
  id?: string,                    // Optional for update
  label: string,                  // Required
  smartBinId: string,             // Required - parent bin ID
  bin_type: string,               // Required
  capacity: number,               // Required
  fill_threshold: number,         // Optional, default 90
  device_id: string,              // Optional - IoT device
  sensors_enabled: {              // Optional
    fill_level: boolean,
    weight: boolean,
    odour_detection: boolean,
    lid_sensor: boolean
  }
}
```

**Returns:** Saved compartment object with ID

---

### FirebaseService.getCompartments()
Gets all compartments with live sensor data merged.

**Returns:** Array of compartment objects

---

### FirebaseService.getCompartmentsByBinId(smartBinId)
Gets compartments for a specific Smart Bin.

**Parameters:**
- `smartBinId` - ID of the parent Smart Bin

**Returns:** Array of compartment objects for that bin

---

### FirebaseService.deleteCompartment(compartmentId)
Deletes a compartment from Firestore.

**Parameters:**
- `compartmentId` - ID of compartment to delete

**Returns:** true if successful

---

## UI Components

### CompartmentForm
Form for adding/editing compartments with:
- Basic details fields
- IoT device selection
- Sensor toggle switches
- Unique ID generation
- Save/Cancel buttons

### CompartmentCard
Display card showing:
- Compartment label and type
- Fill level pie chart
- Live sensor data (only enabled sensors)
- Edit/Delete actions

---

## Example Usage

### Creating a Multi-Compartment Recycling Bin

**Step 1: Create Smart Bin**
```
Name: "Main Entrance Recycling Station"
Location: "Building A - Main Entrance"
Status: Active
Sensors: Temperature, Humidity, Battery
```

**Step 2: Add Plastic Compartment**
```
Label: "Recyclable Plastics"
Type: recyclable
Capacity: 50L
Device ID: sortyx-sensor-two
Sensors: ✅ Fill Level, ✅ Lid Sensor
```

**Step 3: Add Paper Compartment**
```
Label: "Paper & Cardboard"
Type: recyclable
Capacity: 50L
Device ID: plaese-work
Sensors: ✅ Fill Level, ✅ Weight
```

**Step 4: Add General Waste Compartment**
```
Label: "General Waste"
Type: general_waste
Capacity: 40L
Device ID: sortyx-sensor-one
Sensors: ✅ Fill Level, ✅ Odour Detection
```

**Result:** One Smart Bin with 3 compartments, each with its own IoT device and sensor configuration.

---

## Best Practices

### 1. Sensor Configuration
- ✅ Always enable Fill Level sensor for accurate monitoring
- ✅ Enable Weight sensor for high-value recyclables
- ✅ Enable Odour sensor for organic/general waste
- ✅ Enable Lid sensor to detect tampering or overflow

### 2. Device Assignment
- ✅ Use separate IoT device for each compartment when possible
- ⚠️ Can share device but not recommended (data conflicts)
- ✅ Label devices clearly to match compartments

### 3. Capacity Planning
- Set realistic capacity values based on physical bin size
- Adjust fill_threshold based on collection frequency
- Higher threshold (95%) for frequent collection
- Lower threshold (80%) for infrequent collection

### 4. Data Monitoring
- Check sensor data regularly
- Verify sensors show non-zero values
- Alert if sensor stops updating

---

## Troubleshooting

### Compartment not showing data
1. Check if IoT device is online
2. Verify device_id matches sensor collection name
3. Check sensors_enabled configuration
4. Look in Firestore `sensor-data-{deviceId}` collection

### Sensor shows "0" value
1. Is sensor enabled in sensors_enabled?
2. Does IoT device have that sensor type?
3. Check Firestore sensor data for that field
4. Verify sensor hardware is working

### Can't add compartment
1. Ensure Smart Bin exists first
2. Check Firestore permissions
3. Verify smartBinId is set correctly
4. Check console for errors

---

## Migration Notes

If you have existing compartments in old format:

```javascript
// Old format (Realtime Database)
{
  id: "comp-1",
  smartbin_id: "bin-1",
  type: "recyclable"
}

// New format (Firestore)
{
  id: "comp_123",
  smartBinId: "smartbin_123",
  smartbin_id: "smartbin_123",  // Keep for compatibility
  bin_type: "recyclable",
  device_id: "sortyx-sensor-two",
  sensors_enabled: {
    fill_level: true
  },
  current_fill: 35
}
```

Run migration to add required fields and move to Firestore.

---

## Testing Checklist

- [ ] Create Smart Bin successfully
- [ ] Add compartment to Smart Bin
- [ ] Compartment appears in Smart Bin card
- [ ] Live sensor data displays
- [ ] Edit compartment works
- [ ] Delete compartment works
- [ ] Enabled sensors show in UI
- [ ] Disabled sensors hidden from UI
- [ ] Sensors without data show "0"
- [ ] Multiple compartments per bin work
- [ ] Each compartment has own IoT device

---

## Future Enhancements

- Drag-and-drop compartment reordering
- Bulk sensor configuration
- Compartment templates
- Alert rules per compartment
- Historical data charts per compartment
- Compartment fill prediction
