# 🔔 Alerts System Guide

## Overview
The Sortyx Smart Bin system includes an intelligent alert generation system that monitors bin sensor data and automatically creates alerts when thresholds are exceeded.

## Architecture

### Firestore Collections
```
alerts/
  ├── alert_<timestamp>_<random>/
  │   ├── binId: string
  │   ├── compartmentId: string | null
  │   ├── binName: string
  │   ├── binType: 'smart' | 'single' | 'compartment'
  │   ├── type: 'fill_level' | 'battery_low' | 'temperature_high'
  │   ├── severity: 'critical' | 'high' | 'medium' | 'low'
  │   ├── message: string
  │   ├── threshold: number | null
  │   ├── currentValue: number | null
  │   ├── unit: string | null (%, °C, etc.)
  │   ├── timestamp: ISO date string
  │   ├── acknowledged: boolean
  │   ├── acknowledgedAt: ISO date string | null
  │   └── acknowledgedBy: string | null
```

## Alert Types

### 1. Fill Level Alerts
- **Trigger**: When `current_fill >= fill_threshold`
- **Default Threshold**: 80%
- **Severity**:
  - Critical: ≥90% full
  - High: ≥80% full
- **Example**: "Kitchen Bin is 85% full and needs emptying"

### 2. Battery Low Alerts
- **Trigger**: When `battery_level <= battery_threshold`
- **Default Threshold**: 20%
- **Severity**:
  - Critical: ≤10% battery
  - Medium: ≤20% battery
- **Example**: "Kitchen Bin battery level is 15%"

### 3. Temperature High Alerts
- **Trigger**: When `temperature >= temp_threshold`
- **Default Threshold**: 50°C
- **Severity**:
  - Critical: ≥60°C
  - High: ≥50°C
- **Example**: "Kitchen Bin temperature is 55°C"

## FirebaseService Methods

### `getAlerts()`
Retrieves all alerts from Firestore, sorted by timestamp (newest first).

```javascript
const alerts = await FirebaseService.getAlerts();
// Returns: Array of alert objects
```

### `generateAlertsForBins()`
Scans all bins and compartments for alert conditions and creates new alerts.

**Process**:
1. Fetches all smart bins, single bins, and compartments
2. Checks each entity for threshold violations
3. Creates alerts for each violation found
4. Returns array of newly created alerts

**Duplicate Prevention**: Won't create duplicate alerts if an unacknowledged alert of the same type already exists for the same bin.

```javascript
const newAlerts = await FirebaseService.generateAlertsForBins();
// Returns: Array of newly created alert objects
```

### `saveAlert(alertData)`
Creates a new alert in Firestore.

**Parameters**:
```javascript
{
  binId: string,              // Required: Bin ID
  compartmentId: string,      // Optional: For compartment-specific alerts
  binName: string,            // Required: Display name
  binType: string,            // Required: 'smart', 'single', or 'compartment'
  type: string,               // Required: Alert type
  severity: string,           // Required: Alert severity
  message: string,            // Required: Human-readable message
  threshold: number,          // Optional: Threshold value
  currentValue: number,       // Optional: Current sensor value
  unit: string               // Optional: Unit of measurement
}
```

**Example**:
```javascript
await FirebaseService.saveAlert({
  binId: 'bin_1234567890',
  binName: 'Kitchen Bin',
  binType: 'single',
  type: 'fill_level',
  severity: 'high',
  message: 'Kitchen Bin is 85% full and needs emptying',
  threshold: 80,
  currentValue: 85,
  unit: '%'
});
```

### `acknowledgeAlert(alertId, acknowledgedBy)`
Marks an alert as acknowledged.

**Parameters**:
- `alertId` (string): The alert document ID
- `acknowledgedBy` (string): Optional - defaults to 'system'

```javascript
await FirebaseService.acknowledgeAlert('alert_1234567890', 'admin@example.com');
```

### `deleteOldAlerts(daysOld)`
Deletes acknowledged alerts older than specified days.

**Parameters**:
- `daysOld` (number): Optional - defaults to 7 days

```javascript
const deletedCount = await FirebaseService.deleteOldAlerts(30);
// Deletes acknowledged alerts older than 30 days
```

## UI Components

### Alerts Page (`src/pages/Alerts.jsx`)
Full alert management interface with:
- Search and filtering
- Alert statistics (Critical, High, Unacknowledged, Acknowledged)
- Manual alert generation via "Check for Alerts" button
- Auto-generation every 5 minutes
- Alert acknowledgment

### Recent Alerts Widget (`src/components/dashboard/RecentAlerts.jsx`)
Dashboard widget showing:
- Last 5 alerts
- Color-coded severity badges
- Quick view of critical issues
- Link to full Alerts page

### Dashboard Integration
The Dashboard automatically:
- Loads alerts on page load
- Displays alerts in RecentAlerts widget
- Refreshes every 30 seconds

## Automatic Alert Generation

### Auto-Check Intervals
- **Alerts Page**: Checks for new alerts every 5 minutes
- **Dashboard**: Refreshes all data (including alerts) every 30 seconds
- **Manual**: Click "Check for Alerts" button on Alerts page

### Threshold Configuration
Each bin can have custom thresholds stored in Firestore:
```javascript
// Smart Bin or Single Bin document
{
  fill_threshold: 80,      // Fill level alert at 80%
  battery_threshold: 20,   // Battery alert at 20%
  temp_threshold: 50       // Temperature alert at 50°C
}
```

If not specified, default thresholds are used:
- Fill Level: 80%
- Battery: 20%
- Temperature: 50°C

## Alert Lifecycle

1. **Generation**: System detects threshold violation
2. **Creation**: Alert saved to Firestore
3. **Display**: Alert appears in UI
4. **Acknowledgment**: User acknowledges alert
5. **Cleanup**: Old acknowledged alerts deleted after 7 days

## Best Practices

### For Users
1. Regularly check the Alerts page for critical issues
2. Acknowledge alerts after addressing them
3. Adjust bin thresholds based on usage patterns
4. Use the "Check for Alerts" button if you suspect an issue

### For Developers
1. Always check for duplicate alerts before creating
2. Use appropriate severity levels
3. Include threshold and current value for context
4. Clean up old acknowledged alerts to avoid database bloat
5. Test alert generation with various threshold scenarios

## Example Alert Flow

```
1. User adds a bin with default 80% fill threshold
   ↓
2. IoT sensor reports 85% fill level
   ↓
3. generateAlertsForBins() detects violation
   ↓
4. Alert created:
   {
     binId: 'bin_1234',
     binName: 'Kitchen Bin',
     type: 'fill_level',
     severity: 'high',
     message: 'Kitchen Bin is 85% full and needs emptying',
     currentValue: 85,
     threshold: 80
   }
   ↓
5. Alert appears on Dashboard and Alerts page
   ↓
6. User empties bin and acknowledges alert
   ↓
7. Alert marked as acknowledged
   ↓
8. After 7 days, alert is auto-deleted
```

## Troubleshooting

### No Alerts Appearing
1. Check Firebase connection
2. Verify bins have sensor data
3. Manually run `FirebaseService.generateAlertsForBins()`
4. Check browser console for errors

### Duplicate Alerts
- The system prevents duplicates automatically
- If duplicates appear, check the `saveAlert()` duplicate detection logic

### Alerts Not Updating
1. Check the auto-refresh intervals
2. Verify Firestore permissions
3. Check network connectivity

## Migration Notes

The alerts system was migrated from Realtime Database to Firestore with the following changes:

**Old Structure (Realtime Database)**:
```javascript
alerts/
  <push-id>/
    binId, type, severity, message, timestamp, acknowledged
```

**New Structure (Firestore)**:
```javascript
alerts/
  alert_<timestamp>_<random>/
    binId, compartmentId, binName, binType, type, severity,
    message, threshold, currentValue, unit, timestamp,
    acknowledged, acknowledgedAt, acknowledgedBy
```

**Key Improvements**:
- Supports compartment-specific alerts
- Includes threshold and current value context
- Tracks who acknowledged and when
- Better duplicate prevention
- Automatic cleanup of old alerts
- More detailed severity levels

## Related Files
- `src/services/firebaseService.js` - Alert generation and management
- `src/pages/Alerts.jsx` - Alert management UI
- `src/components/dashboard/RecentAlerts.jsx` - Dashboard widget
- `src/pages/Dashboard.jsx` - Dashboard integration
