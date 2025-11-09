# Admin Role Setup Guide

This guide explains how to set up admin users in the Sortyx Bin Monitoring application.

## 🎯 Overview

The application now supports role-based access control with two roles:
- **`user`** - Standard user with access to their own bins and data
- **`admin`** - Administrator with access to all users and admin panel

## 🔧 Setting Up Your First Admin User

### Method 1: Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the `users` collection

3. **Find Your User Document**
   - Locate the document with your user ID (Firebase Auth UID)
   - Click on the document to edit it

4. **Add the Role Field**
   - Click "Add field"
   - Field name: `role`
   - Field type: `string`
   - Field value: `admin`
   - Click "Save"

5. **Refresh Your Application**
   - Log out and log back in
   - You should now see the Admin Panel and Users tabs in the navigation

### Method 2: Using Firebase CLI

```javascript
// Run this in Firebase Console > Firestore > Rules > Console
const admin = require('firebase-admin');
const db = admin.firestore();

// Replace with your user's email
const userEmail = 'your-email@example.com';

// Find and update user
const usersRef = db.collection('users');
const snapshot = await usersRef.where('email', '==', userEmail).get();

if (!snapshot.empty) {
  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({ role: 'admin' });
  console.log('User promoted to admin!');
} else {
  console.log('User not found');
}
```

## 📋 Features Available to Admin Users

### 1. Admin Navigation Tabs
- **Admin Panel** - System overview and settings
- **Users** - User management interface

### 2. User Management
- View all users in the system
- Edit user profiles (phone, subscription, status)
- Update user roles (promote/demote admins)
- View user activity and statistics

### 3. Role Management in Profile
- Admins can see and edit the "Role" field in any user's profile
- Regular users can see their role but cannot change it
- Role changes are immediately reflected in the navigation

### 4. User Impersonation
- View the application from any user's perspective
- Test features as different users
- Access via the Users page

## 🛡️ Security Considerations

### Backend Validation
The application includes role checks on the backend:
- Only admin users can list all users
- Only admin users can update other users' profiles
- Role changes are validated before saving

### Firestore Security Rules
Add these rules to protect the users collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own profile (except role)
      allow update: if request.auth != null && 
                       request.auth.uid == userId &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
      
      // Admins can read and update any user (including roles)
      allow read, update: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // New users can be created by authentication
      allow create: if request.auth != null;
    }
  }
}
```

## 🎨 User Interface Changes

### Navigation Bar
- Admin tabs (Admin Panel, Users) are **only visible to admin users**
- Regular users will not see these tabs

### Profile Page
- **All users** can see their role displayed as a badge
- **Admin badge**: Purple gradient with shield icon
- **User badge**: Outlined badge
- **Only admins** can edit the role field (with crown icon)
- Regular users see "Only admins can change roles" message

### User Management Page
- Admins can edit any user's role via the Users table
- Role dropdown is enabled only for admin users
- Premium subscription warnings removed for role management

## 🔄 Testing Your Setup

1. **Create a test user account**
   ```bash
   Email: testuser@example.com
   Password: Test123!
   ```

2. **Login as admin**
   - You should see Admin Panel and Users tabs
   - Navigate to Profile and verify you see "Admin" badge

3. **Open Users page**
   - You should see all registered users
   - Click edit on the test user

4. **Change test user's role**
   - Set role to "admin"
   - Save changes
   - Login as test user to verify admin access

5. **Test role changes in profile**
   - Go to your profile
   - Click "Edit Profile"
   - Change role to "user"
   - Save and logout
   - Admin tabs should disappear

## 📱 Quick Reference

### Default Values
- New users: `role: "user"`
- Created via: `createUserProfile()` in customClient.js

### API Methods
```javascript
// List all users (admin only)
const users = await User.list();

// Update user role (admin only)
await User.update(userId, { role: 'admin' });

// Update own profile (any user)
await User.updateMyUserData({ role: 'admin' }); // Works only for admins
```

### Role Checks
```javascript
// Check if user is admin
const user = await User.me();
const isAdmin = user?.role === 'admin';
```

## 🐛 Troubleshooting

### Admin tabs not showing?
- Verify role field is exactly `admin` (lowercase)
- Clear browser cache and reload
- Check browser console for errors

### Can't update roles?
- Verify you're logged in as an admin
- Check Firestore security rules
- Verify the user document exists

### Role changes not persisting?
- Check Firebase Console for the updated value
- Verify updateDoc() is not throwing errors
- Check network tab for API errors

## 📚 Related Files

- `src/api/customClient.js` - User API with role support
- `src/pages/Layout.jsx` - Navigation with admin tabs
- `src/components/profile/ProfileDetails.jsx` - Role display and editing
- `src/pages/Users.jsx` - User management page
- `src/components/admin/UserEditDialog.jsx` - User edit form

---

For more information, contact support or check the main README.md
