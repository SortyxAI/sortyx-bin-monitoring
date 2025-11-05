# User-Based System Implementation Guide

## Overview
The sortyx-bin-monitoring application has been enhanced to be fully user-driven. All data operations (bins, compartments, alerts) are now tied to the authenticated user's Firebase UID.

## Key Changes Implemented

### 1. **Firebase Authentication Integration**
- Replaced mock authentication with real Firebase Auth
- Users sign in with email/password
- Firebase UID is used as the primary user identifier
- User profiles stored in Firestore `users` collection

### 2. **User Profile Structure**
```javascript
{
  userId: "firebase_uid",
  email: "user@example.com",
  full_name: "User Name",
  plan: "free", // or "pro", "enterprise"
  subscription_plan: "free",
  applicationId: null, // TTN Application ID (optional)
  smartbin_order: [], // Custom bin ordering
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z"
}
```

### 3. **Data Collections with userId**

#### SmartBins Collection: `smart-bins`
```javascript
{
  id: "smart-bin-123",
  userId: "firebase_uid", // ✅ NEW - User ownership
  name: "Office Bin",
  location: "Building A",
  status: "active",
  // ... other fields
}
```

#### SingleBins Collection: `single-bins`
```javascript
{
  id: "single-bin-456",
  userId: "firebase_uid", // ✅ NEW - User ownership
  name: "Kitchen Bin",
  iot_device_id: "device-001",
  // ... other fields
}
```

#### Compartments Collection: `compartments`
```javascript
{
  id: "compartment-789",
  userId: "firebase_uid", // ✅ NEW - User ownership
  smartBinId: "smart-bin-123",
  label: "Plastics",
  // ... other fields
}
```

#### Alerts Collection: `alerts`
```javascript
{
  id: "alert-001",
  userId: "firebase_uid", // ✅ NEW - User ownership
  bin_id: "single-bin-456",
  severity: "critical",
  // ... other fields
}
```

## API Changes

### Authentication Methods

#### Login
```javascript
import { User } from '@/api/entities';

const { token, user } = await User.login('user@example.com', 'password123');
// Returns user profile with Firebase UID
```

#### Register
```javascript
const { token, user } = await User.register('user@example.com', 'password123', 'Full Name');
// Creates Firebase Auth account and Firestore profile
```

#### Get Current User
```javascript
const currentUser = await User.me();
// Returns: { id: "firebase_uid", email: "...", full_name: "...", ... }
```

### Data Retrieval (Now User-Filtered)

#### Get SmartBins
```javascript
import { FirebaseService } from '@/services/firebaseService';
import { getCurrentUserId } from '@/config/firebase';

const userId = await getCurrentUserId();
const smartBins = await FirebaseService.getSmartBins(userId);
// Returns only bins owned by this user
```

#### Get SingleBins
```javascript
const singleBins = await FirebaseService.getSingleBins(userId);
```

#### Get Compartments
```javascript
const compartments = await FirebaseService.getCompartments(userId);
```

#### Get Alerts
```javascript
const alerts = await FirebaseService.getAlerts(userId);
```

### Data Saving (Auto-includes userId)

#### Save SmartBin
```javascript
const userId = await getCurrentUserId();
const binData = {
  name: "New Bin",
  location: "Office",
  // ... other data
};
await FirebaseService.saveSmartBin(binData, userId);
// Automatically adds userId to the document
```

#### Save SingleBin
```javascript
await FirebaseService.saveSingleBin(binData, userId);
```

#### Save Compartment
```javascript
await FirebaseService.saveCompartment(compartmentData, userId);
```

#### Save Alert
```javascript
await FirebaseService.saveAlert(alertData, userId);
```

## Security Recommendations

### Firestore Security Rules
Update your Firestore security rules to enforce user-based access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own bins
    match /smart-bins/{binId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
    }
    
    match /single-bins/{binId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
    }
    
    match /compartments/{compartmentId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
    }
    
    match /alerts/{alertId} {
      allow read, write: if request.auth != null && 
                           resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                     request.resource.data.userId == request.auth.uid;
    }
    
    // Sensor data is read-only for authenticated users
    match /sensor-data-{deviceId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
    
    match /all-sensor-data/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

## Migration Guide

### For Existing Data
If you have existing data without userId fields, run this migration:

```javascript
import { getCurrentUserId } from '@/config/firebase';
import { db } from '@/config/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrateDataToUser(userId) {
  // Migrate smart-bins
  const smartBinsRef = collection(db, 'smart-bins');
  const smartBinsSnapshot = await getDocs(smartBinsRef);
  
  for (const docSnapshot of smartBinsSnapshot.docs) {
    const data = docSnapshot.data();
    if (!data.userId) {
      await updateDoc(doc(db, 'smart-bins', docSnapshot.id), {
        userId: userId,
        updated_at: new Date().toISOString()
      });
    }
  }
  
  // Repeat for single-bins, compartments, and alerts...
  console.log('Migration complete!');
}
```

## Testing

### Create Test User
```javascript
// In browser console or test script
import { User } from '@/api/entities';

const testUser = await User.register(
  'test@sortyx.com', 
  'test123', 
  'Test User'
);
console.log('Test user created:', testUser);
```

### Verify Data Isolation
1. Login as User A
2. Create a bin
3. Logout
4. Login as User B
5. Verify User B cannot see User A's bins

## Features Enabled

✅ **Multi-tenant Support** - Multiple users can use the system simultaneously
✅ **Data Isolation** - Each user only sees their own data
✅ **User Profiles** - Stored in Firestore with subscription plans
✅ **Real Authentication** - Firebase Auth with email/password
✅ **Secure by Default** - userId automatically added to all documents
✅ **Fresh Start** - New users start with empty dashboard
✅ **Subscription Plans** - Support for free, pro, and enterprise tiers

## Next Steps

1. **Deploy Firestore Security Rules** - Apply the rules above to production
2. **Test Authentication Flow** - Verify login/register/logout work correctly
3. **Test Data Isolation** - Create multiple test users and verify separation
4. **Add User Registration UI** - Create a signup page (currently only login exists)
5. **Add Password Reset** - UI for password reset functionality
6. **Add User Settings** - Page to update profile and application ID

## Support

For issues or questions:
- Check Firebase Auth logs in Firebase Console
- Check Firestore data structure in Firebase Console
- Review browser console for authentication errors
- Verify environment variables are set correctly

