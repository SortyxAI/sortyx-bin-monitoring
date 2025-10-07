# 🗑️ Delete Functionality Guide

## Overview
The Sortyx Smart Bin system includes comprehensive delete functionality for bins, compartments, and associated data with automatic cascade deletion to maintain data integrity.

## Delete Operations

### 1. Delete Smart Bin
**Function**: `FirebaseService.deleteSmartBin(binId)`

**What gets deleted**:
1. The smart bin document from `smart-bins` collection
2. All compartments associated with the bin from `compartments` collection
3. All alerts associated with the bin from `alerts` collection

**Example**:
```javascript
await FirebaseService.deleteSmartBin('bin_1234567890');
// Deletes: bin + all compartments + all alerts
```

**UI Location**:
- Smart Bins page → Smart Bin card → Delete button (trash icon)

**Confirmation**: Yes, shows warning about compartments being deleted too

**Success Message**: "Smart bin and its compartments deleted successfully!"

---

### 2. Delete Single Bin
**Function**: `FirebaseService.deleteSingleBin(binId)`

**What gets deleted**:
1. The single bin document from `single-bins` collection
2. All alerts associated with the bin from `alerts` collection

**Example**:
```javascript
await FirebaseService.deleteSingleBin('bin_1234567890');
// Deletes: bin + all alerts
```

**UI Location**:
- Smart Bins page → Single Bins section → Bin card → Delete button (trash icon)

**Confirmation**: Yes, asks "Are you sure you want to delete this SingleBin?"

**Success Message**: "Single bin deleted successfully!"

---

### 3. Delete Compartment
**Function**: `FirebaseService.deleteCompartment(compartmentId)`

**What gets deleted**:
1. The compartment document from `compartments` collection
2. All alerts associated with the compartment from `alerts` collection

**Example**:
```javascript
await FirebaseService.deleteCompartment('comp_1234567890');
// Deletes: compartment + compartment-specific alerts
```

**UI Location**:
- Smart Bins page → Smart Bin (expanded) → Compartment card → Delete button

**Confirmation**: Yes, asks "Are you sure you want to delete this compartment?"

**Success Message**: "Compartment deleted successfully!"

---

## Cascade Deletion Details

### Smart Bin Deletion Cascade
```
Smart Bin (bin_123)
  ↓
├─ Compartment 1 (comp_456) ✗ DELETED
│   └─ Alerts for comp_456 ✗ DELETED
├─ Compartment 2 (comp_789) ✗ DELETED
│   └─ Alerts for comp_789 ✗ DELETED
└─ Alerts for bin_123 ✗ DELETED
```

### Single Bin Deletion Cascade
```
Single Bin (bin_123)
  ↓
└─ Alerts for bin_123 ✗ DELETED
```

### Compartment Deletion Cascade
```
Compartment (comp_456)
  ↓
└─ Alerts for comp_456 ✗ DELETED
```

---

## Implementation Details

### Smart Bin Delete Code
```javascript
static async deleteSmartBin(binId) {
  // 1. Delete the bin document
  const binDoc = doc(db, 'smart-bins', binId);
  await deleteDoc(binDoc);
  
  // 2. Find and delete all compartments
  const compartmentsQuery = firestoreQuery(
    collection(db, 'compartments'),
    where('smartBinId', '==', binId)
  );
  const compartments = await getDocs(compartmentsQuery);
  await Promise.all(compartments.docs.map(d => deleteDoc(d.ref)));
  
  // 3. Find and delete all alerts
  const alertsQuery = firestoreQuery(
    collection(db, 'alerts'),
    where('binId', '==', binId)
  );
  const alerts = await getDocs(alertsQuery);
  await Promise.all(alerts.docs.map(d => deleteDoc(d.ref)));
}
```

### Single Bin Delete Code
```javascript
static async deleteSingleBin(binId) {
  // 1. Delete the bin document
  const binDoc = doc(db, 'single-bins', binId);
  await deleteDoc(binDoc);
  
  // 2. Find and delete all alerts
  const alertsQuery = firestoreQuery(
    collection(db, 'alerts'),
    where('binId', '==', binId)
  );
  const alerts = await getDocs(alertsQuery);
  await Promise.all(alerts.docs.map(d => deleteDoc(d.ref)));
}
```

### Compartment Delete Code
```javascript
static async deleteCompartment(compartmentId) {
  // 1. Delete the compartment document
  const compartmentDoc = doc(db, 'compartments', compartmentId);
  await deleteDoc(compartmentDoc);
  
  // 2. Find and delete all compartment alerts
  const alertsQuery = firestoreQuery(
    collection(db, 'alerts'),
    where('compartmentId', '==', compartmentId)
  );
  const alerts = await getDocs(alertsQuery);
  await Promise.all(alerts.docs.map(d => deleteDoc(d.ref)));
}
```

---

## UI Integration

### SmartBins.jsx Handler Functions

```javascript
const handleDeleteBin = async (binId) => {
  if (window.confirm('Are you sure you want to delete this SmartBin? All compartments will also be deleted.')) {
    try {
      await FirebaseService.deleteSmartBin(binId);
      alert('Smart bin and its compartments deleted successfully!');
      loadData(); // Refresh data
    } catch (error) {
      alert(`Failed to delete smart bin: ${error.message}`);
    }
  }
};

const handleDeleteSingleBin = async (binId) => {
  if (window.confirm('Are you sure you want to delete this SingleBin?')) {
    try {
      await FirebaseService.deleteSingleBin(binId);
      alert('Single bin deleted successfully!');
      loadData(); // Refresh data
    } catch (error) {
      alert(`Failed to delete single bin: ${error.message}`);
    }
  }
};

const handleDeleteCompartment = async (compartmentId) => {
  if (window.confirm('Are you sure you want to delete this compartment?')) {
    try {
      await FirebaseService.deleteCompartment(compartmentId);
      alert('Compartment deleted successfully!');
      loadData(); // Refresh data
    } catch (error) {
      alert(`Failed to delete compartment: ${error.message}`);
    }
  }
};
```

---

## Data Integrity

### Why Cascade Delete?
1. **Prevent Orphaned Data**: Compartments without bins, alerts without bins
2. **Save Storage**: Remove unused data from Firestore
3. **Clean UI**: No references to deleted entities
4. **Data Consistency**: All related data removed together

### What Happens to IoT Sensor Data?
**Sensor data is NOT deleted** because:
- Stored in device-specific collections (`sensor-data-{deviceId}`)
- Can be reused if device is reassigned to new bin
- Historical data may be valuable for analytics
- IoT devices continue reporting regardless of bin assignment

---

## Error Handling

### Common Errors

**1. Permission Denied**
```
Error: Missing or insufficient permissions
```
**Solution**: Check Firestore security rules

**2. Document Not Found**
```
Error: No document to delete
```
**Solution**: Already deleted or invalid ID

**3. Network Error**
```
Error: Failed to delete document
```
**Solution**: Check internet connection, retry

### Logging
All delete operations log:
- **Start**: `🗑️ Deleting [type] [id] from Firestore...`
- **Success**: `✅ Deleted [type] [id] and [count] related items`
- **Error**: `❌ Error deleting [type] [id]: [error message]`

---

## Testing Delete Functionality

### Test Checklist

**Smart Bin Deletion**:
- [ ] Bin is removed from UI
- [ ] All compartments are deleted
- [ ] All bin alerts are deleted
- [ ] Data refreshes automatically
- [ ] Success message appears
- [ ] Console logs show correct counts

**Single Bin Deletion**:
- [ ] Bin is removed from UI
- [ ] All bin alerts are deleted
- [ ] Data refreshes automatically
- [ ] Success message appears

**Compartment Deletion**:
- [ ] Compartment is removed from UI
- [ ] Compartment alerts are deleted
- [ ] Parent bin remains intact
- [ ] Other compartments unaffected
- [ ] Success message appears

---

## Best Practices

### For Users
1. **Double-check before deleting** - Deletion is permanent
2. **Export data if needed** - No undo functionality
3. **Delete compartments first** if you want to keep the bin but remove sections
4. **Check for active alerts** before deleting bins

### For Developers
1. **Always use confirmation dialogs** for delete operations
2. **Log all delete operations** for debugging
3. **Show success/error messages** to user
4. **Refresh data after deletion** to update UI
5. **Test cascade deletion** thoroughly
6. **Handle errors gracefully** with try-catch

---

## Migration Notes

### Old System (Pre-Firestore)
- Used old API entities: `SmartBin.delete()`, `SingleBin.delete()`
- Manual compartment deletion required
- No cascade deletion for alerts
- Realtime Database structure

### New System (Firestore)
- Unified FirebaseService methods
- Automatic cascade deletion
- Deletes related alerts automatically
- Firestore collections with proper queries

---

## Security Considerations

### Firestore Rules
Ensure proper security rules for deletion:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Smart bins - only owner can delete
    match /smart-bins/{binId} {
      allow delete: if request.auth != null && 
                       resource.data.created_by == request.auth.token.email;
    }
    
    // Single bins - only owner can delete
    match /single-bins/{binId} {
      allow delete: if request.auth != null && 
                       resource.data.created_by == request.auth.token.email;
    }
    
    // Compartments - only bin owner can delete
    match /compartments/{compId} {
      allow delete: if request.auth != null;
      // TODO: Verify bin ownership
    }
    
    // Alerts - can be deleted by authenticated users
    match /alerts/{alertId} {
      allow delete: if request.auth != null;
    }
  }
}
```

---

## Related Files
- `src/services/firebaseService.js` - Delete methods implementation
- `src/pages/SmartBins.jsx` - UI handlers and user interaction
- `ALERTS_SYSTEM_GUIDE.md` - Alert management documentation
- `COMPARTMENT_GUIDE.md` - Compartment system documentation
