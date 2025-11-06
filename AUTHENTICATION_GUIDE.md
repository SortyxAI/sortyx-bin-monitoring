# 🔐 Authentication System - Sortyx Smart Bin

## Overview
The Sortyx Smart Bin application now features a **fully secure authentication system** powered by **Firebase Authentication** with the following capabilities:

- ✅ **Email/Password Sign Up & Login**
- ✅ **Google Sign-In Integration**
- ✅ **Password Reset via Email**
- ✅ **Encrypted Credential Storage**
- ✅ **Password Strength Indicator**
- ✅ **Session Management**
- ✅ **User Profile Auto-Creation**

---

## 🔒 Security Features

### Firebase Authentication
All user credentials are managed by **Firebase Authentication**, which provides:
- **Industry-standard encryption** (bcrypt for passwords)
- **Secure token-based sessions**
- **Built-in protection** against common attacks (SQL injection, XSS, CSRF)
- **Email verification** support
- **Rate limiting** on authentication attempts
- **No passwords stored in Firestore** - Firebase Auth handles all credential management securely

### Password Requirements
- Minimum 6 characters
- Password strength indicator shows: Weak, Fair, Good, Strong
- Visual feedback for password matching during sign-up

---

## 🎨 User Interface Features

### 1. **Sign In Mode** (Default)
- Email and password input fields
- "Forgot password?" link
- "Sign in with Google" button
- Toggle to "Sign up" mode
- Show/hide password toggle

### 2. **Sign Up Mode**
- Full name field
- Email field
- Password field with strength indicator
- Confirm password field with match validation
- "Sign up with Google" button
- Toggle back to "Sign in"

### 3. **Forgot Password Mode**
- Email input to receive reset link
- Sends secure reset email via Firebase
- Back to sign-in button

### 4. **Visual Enhancements**
- Animated gradient backgrounds
- Smooth transitions between modes
- Success/error alerts with icons
- Loading spinners during authentication
- Password visibility toggle
- Responsive design for all screen sizes

---

## 🚀 How to Use

### For New Users (Sign Up)

#### Option 1: Email/Password Sign Up
1. Click **"Sign up"** link on the login page
2. Enter your **full name**
3. Enter your **email address**
4. Create a **password** (min. 6 characters)
   - Watch the password strength indicator
5. **Confirm your password**
6. Click **"Create Account"**
7. You'll be automatically logged in

#### Option 2: Google Sign Up
1. Click **"Sign up"** link on the login page
2. Click **"Sign up with Google"**
3. Select your Google account
4. Grant permissions
5. You'll be automatically logged in

### For Existing Users (Sign In)

#### Option 1: Email/Password Login
1. Enter your **email address**
2. Enter your **password**
3. Click **"Sign In"**

#### Option 2: Google Login
1. Click **"Sign in with Google"**
2. Select your Google account
3. You'll be logged in instantly

### Password Reset
1. On the login page, click **"Forgot password?"**
2. Enter your **email address**
3. Click **"Send Reset Link"**
4. Check your email inbox
5. Click the reset link in the email
6. Create a new password
7. Return to login page and sign in

---

## 🔧 Technical Implementation

### Authentication Flow

```javascript
// Sign Up
User.register(email, password, fullName)
  ↓
Firebase Authentication creates user
  ↓
User profile created in Firestore 'users' collection
  ↓
User automatically logged in
```

```javascript
// Login
User.login(email, password)
  ↓
Firebase Authentication verifies credentials
  ↓
Session token generated and stored
  ↓
User profile fetched from Firestore
  ↓
User logged in
```

```javascript
// Google Sign In
signInWithPopup(auth, GoogleAuthProvider)
  ↓
Google OAuth flow
  ↓
User profile created/updated in Firestore
  ↓
User logged in
```

### Firestore Data Structure

When a user signs up, their profile is stored in Firestore:

```javascript
users/{userId} = {
  userId: "firebase-uid",
  email: "user@example.com",
  full_name: "John Doe",
  plan: "free",
  subscription_plan: "free",
  applicationId: null,
  smartbin_order: [],
  created_at: "2025-01-06T10:30:00Z",
  updated_at: "2025-01-06T10:30:00Z"
}
```

### Security Rules Required

Ensure your Firestore security rules include:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Smart bins - users can only access their own bins
    match /smart-bins/{binId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Single bins - users can only access their own bins
    match /single-bins/{binId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Compartments - users can only access their own compartments
    match /compartments/{compartmentId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Alerts - users can only access their own alerts
    match /alerts/{alertId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 🔑 Firebase Configuration

### Required Environment Variables
Ensure your `.env` file contains:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=your-database-url
```

### Enable Authentication Methods in Firebase Console
1. Go to **Firebase Console** → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** provider
   - Add your OAuth client ID
   - Add authorized domains (localhost, your production domain)

---

## 🛡️ Password Security Best Practices

### What Firebase Auth Does for You:
- ✅ Passwords are hashed using **bcrypt** with salt
- ✅ Never stored in plain text
- ✅ Secure password reset via email
- ✅ Session tokens with expiration
- ✅ Automatic token refresh
- ✅ Protection against brute force attacks

### User Guidelines:
- Use passwords with **at least 8 characters**
- Include **uppercase and lowercase letters**
- Include **numbers**
- Include **special characters**
- Don't reuse passwords from other sites

---

## 📱 Session Management

### How Sessions Work:
1. Upon successful login, Firebase generates an **ID token**
2. Token is stored in **localStorage** as `auth_token`
3. Token is **automatically refreshed** by Firebase
4. Token expires after **1 hour** (Firebase default)
5. User is logged out when token expires

### Logout Process:
1. Click logout button in the app
2. Firebase Auth session is terminated
3. Token removed from localStorage
4. User redirected to login page

---

## 🔄 Google Sign-In Configuration

### Setup Steps:
1. Enable Google provider in Firebase Console
2. Add OAuth client ID
3. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
4. Add authorized redirect URIs:
   - `http://localhost:5173/__/auth/handler` (development)
   - `https://yourdomain.com/__/auth/handler` (production)

### User Experience:
1. Click "Sign in with Google" button
2. Google popup appears
3. User selects/logs into Google account
4. Permissions requested
5. User profile automatically created in Firestore
6. Logged in instantly

---

## 🐛 Troubleshooting

### "Popup closed by user"
**Solution:** User closed the Google sign-in popup. Try again.

### "Email already in use"
**Solution:** User tried to sign up with an email that already exists. Use "Forgot password" or sign in instead.

### "Weak password"
**Solution:** Password must be at least 6 characters. Use the strength indicator to create a stronger password.

### "User not found"
**Solution:** No account exists with that email. Click "Sign up" to create an account.

### "Wrong password"
**Solution:** Incorrect password. Use "Forgot password" to reset it.

### Password reset email not received
**Solution:** 
- Check spam folder
- Verify email address is correct
- Wait a few minutes and try again
- Contact support if issue persists

---

## 📊 User Analytics

Firebase Authentication provides built-in analytics:
- **Sign-up methods** (email vs Google)
- **Login frequency**
- **Active users**
- **Geographic distribution**

Access these in **Firebase Console** → **Authentication** → **Users**

---

## 🎯 Future Enhancements

Planned features:
- [ ] Email verification requirement
- [ ] Multi-factor authentication (MFA)
- [ ] Social sign-in (Facebook, Apple)
- [ ] Phone number authentication
- [ ] Anonymous authentication for testing
- [ ] Custom email templates
- [ ] Account linking (merge email & Google accounts)

---

## 📞 Support

For authentication issues, contact:
- **Email:** support@sortyx.com
- **Documentation:** Firebase Auth Docs

---

## ✅ Security Checklist

- [x] Passwords encrypted by Firebase Auth
- [x] Session tokens with expiration
- [x] HTTPS enforced in production
- [x] CSRF protection via Firebase
- [x] XSS prevention
- [x] Rate limiting on auth attempts
- [x] Password strength validation
- [x] Secure password reset flow
- [x] User data segregation in Firestore
- [x] OAuth 2.0 for Google Sign-In

---

**Last Updated:** January 6, 2025
**Version:** 1.0.0
