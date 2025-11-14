// Firebase-based API client for Sortyx Smart Bin application
// Now uses Firebase Authentication and user-based data segregation

import { FirebaseService } from '../services/firebaseService';
import { auth, getCurrentUser, getCurrentUserId } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

class FirebaseAPIClient {
  constructor() {
    this.currentUser = null;
  }

  // Real Firebase Authentication
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get or create user profile in Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // Create default profile if it doesn't exist
        await this.createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || email.split('@')[0],
          created_at: new Date().toISOString()
        });
      }
      
      // Fetch complete user data
      this.currentUser = await this.me();
      
      const token = await firebaseUser.getIdToken();
      localStorage.setItem('auth_token', token);
      
      console.log('✅ User logged in successfully:', this.currentUser.email);
      
      return { token, user: this.currentUser };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  // Register new user
  async register(email, password, fullName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      if (fullName) {
        await updateProfile(firebaseUser, { displayName: fullName });
      }
      
      // Create user profile in Firestore
      await this.createUserProfile(firebaseUser.uid, {
        email: email,
        full_name: fullName || email.split('@')[0],
        plan: 'free',
        subscription_plan: 'free',
        applicationId: null,
        smartbin_order: [],
        created_at: new Date().toISOString(),
        isNewUser: true // Flag for welcome email
      });
      
      console.log('✅ User registered successfully:', email);
      
      // Login first to get the token
      const loginResult = await this.login(email, password);
      
      // Send welcome email after login (non-blocking)
      this.sendWelcomeEmail(email, fullName || email.split('@')[0], firebaseUser)
        .then(() => console.log('✅ Welcome email sent'))
        .catch(err => console.warn('⚠️ Welcome email failed:', err.message));
      
      return loginResult;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new Error(error.message || 'Registration failed.');
    }
  }

  // Send welcome email via backend
  async sendWelcomeEmail(email, userName, firebaseUser = null) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      console.log(`📧 Requesting welcome email for: ${email}`);
      
      const response = await fetch(`${backendUrl}/api/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, userName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to send welcome email');
      }

      console.log('✅ Welcome email request successful');
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      // Don't throw - email is not critical for registration
      return false;
    }
  }

  // Get current user profile from Firestore
  async getUserProfile(userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return { id: userId, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      return null;
    }
  }

  // Create user profile in Firestore
  async createUserProfile(userId, userData) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const profileData = {
        ...userData,
        userId: userId,
        plan: userData.plan || 'free',
        subscription_plan: userData.subscription_plan || 'free',
        role: userData.role || 'user',
        applicationId: userData.applicationId || null,
        smartbin_order: userData.smartbin_order || [],
        // ✅ Add notification preference fields
        email_alert_enabled: userData.email_alert_enabled ?? true,
        sms_alert_enabled: userData.sms_alert_enabled ?? false,
        whatsapp_alert_enabled: userData.whatsapp_alert_enabled ?? false,
        alert_email: userData.alert_email || userData.email || '',
        alert_phone: userData.alert_phone || '',
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await setDoc(userDocRef, profileData);
      console.log('✅ User profile created:', userId);
      
      return profileData;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  // Get current authenticated user
  async me() {
    try {
      const firebaseUser = await getCurrentUser();
      
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        // Create profile if missing
        return await this.createUserProfile(firebaseUser.uid, {
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        });
      }
      
      this.currentUser = userProfile;
      return userProfile;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error;
    }
  }

  // Update user profile
  async updateMyUserData(data) {
    try {
      const firebaseUser = await getCurrentUser();
      
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(userDocRef, updateData);
      
      // Update local cache
      this.currentUser = { ...this.currentUser, ...updateData };
      
      console.log('✅ User profile updated');
      return this.currentUser;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  // Password reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('impersonatedUser');
      this.currentUser = null;
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  // Firebase-based CRUD operations (now user-scoped)
  async getSmartBins(userId = null) {
    try {
      const effectiveUserId = userId || (await getCurrentUserId());
      return await FirebaseService.getSmartBins(effectiveUserId);
    } catch (error) {
      console.error('Error fetching smart bins:', error);
      return [];
    }
  }

  async getCompartments(userId = null) {
    try {
      const effectiveUserId = userId || (await getCurrentUserId());
      return await FirebaseService.getCompartments(effectiveUserId);
    } catch (error) {
      console.error('Error fetching compartments:', error);
      return [];
    }
  }

  async getAlerts(userId = null) {
    try {
      const effectiveUserId = userId || (await getCurrentUserId());
      return await FirebaseService.getAlerts(effectiveUserId);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async getSensorData(deviceId) {
    try {
      return await FirebaseService.getHistoricalData(deviceId);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  subscribeToSensorData(deviceId, callback) {
    return FirebaseService.subscribeToSensorData(deviceId, callback);
  }
}

// Create Firebase-based entity classes
class FirebaseEntityBase {
  constructor(client, entityName) {
    this.client = client;
    this.entityName = entityName;
  }

  async list(orderBy = null, limit = null) {
    const userId = await getCurrentUserId();
    
    switch(this.entityName) {
      case 'smartbins':
        return await this.client.getSmartBins(userId);
      case 'compartments':
        return await this.client.getCompartments(userId);
      case 'alerts':
        return await this.client.getAlerts(userId);
      case 'singlebins':
        return await FirebaseService.getSingleBins(userId);
      case 'subscription-plans':
        return [
          { id: 1, name: 'Free', price: 0, features: ['Up to 10 bins', 'Basic monitoring', 'Email alerts'] },
          { id: 2, name: 'Pro', price: 29.99, features: ['Unlimited bins', 'Real-time monitoring', 'Advanced analytics', 'Priority support'] },
          { id: 3, name: 'Enterprise', price: 99.99, features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee'] }
        ];
      default:
        return [];
    }
  }

  async filter(filters = {}, orderBy = null, limit = null) {
    const data = await this.list(orderBy, limit);
    
    // Apply filters
    if (Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'created_by' || key === 'userId') {
          return true; // Already filtered by user in list()
        }
        if (key === 'resolved' && this.entityName === 'alerts') {
          return item.resolved === value || item.status === (value ? 'resolved' : 'active');
        }
        return item[key] === value;
      });
    });
  }

  async create(data) {
    console.log(`Would create ${this.entityName}:`, data);
    return { id: Date.now(), ...data };
  }

  async update(id, data) {
    console.log(`Would update ${this.entityName} ${id}:`, data);
    return { id, ...data };
  }

  async delete(id) {
    console.log(`Would delete ${this.entityName} ${id}`);
    return { success: true };
  }

  async get(id) {
    const data = await this.list();
    return data.find(item => item.id === id);
  }
}

// Initialize Firebase client
const firebaseClient = new FirebaseAPIClient();

// Create entity instances
export const SmartBin = new FirebaseEntityBase(firebaseClient, 'smartbins');
export const Compartment = new FirebaseEntityBase(firebaseClient, 'compartments');
export const SingleBin = new FirebaseEntityBase(firebaseClient, 'singlebins');
export const Alert = new FirebaseEntityBase(firebaseClient, 'alerts');
export const SubscriptionPlan = new FirebaseEntityBase(firebaseClient, 'subscription-plans');

// Auth object that uses Firebase
export const User = {
  async login(email, password) {
    return await firebaseClient.login(email, password);
  },
  
  async register(email, password, fullName) {
    return await firebaseClient.register(email, password, fullName);
  },
  
  async me() {
    return await firebaseClient.me();
  },
  
  async updateMyUserData(data) {
    return await firebaseClient.updateMyUserData(data);
  },
  
  // ✅ NEW: Admin function to list all users
  async list() {
    try {
      const currentUser = await firebaseClient.me();
      
      // Check if user is admin
      if (currentUser?.role !== 'admin') {
        console.warn('⚠️ Non-admin user attempted to list all users');
        return [];
      }
      
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const users = [];
      usersSnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`✅ Loaded ${users.length} users`);
      return users;
    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw error;
    }
  },
  
  // ✅ NEW: Admin function to update any user's profile
  async update(userId, data) {
    try {
      const currentUser = await firebaseClient.me();
      
      // Check if user is admin
      if (currentUser?.role !== 'admin') {
        throw new Error('Permission denied: Only admins can update user profiles');
      }
      
      const userDocRef = doc(db, 'users', userId);
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(userDocRef, updateData);
      
      console.log(`✅ User ${userId} updated by admin`);
      return { id: userId, ...updateData };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  },
  
  // ✅ NEW: Admin function to get any user's profile
  async get(userId) {
    try {
      const currentUser = await firebaseClient.me();
      
      // Check if user is admin
      if (currentUser?.role !== 'admin') {
        throw new Error('Permission denied: Only admins can view other user profiles');
      }
      
      return await firebaseClient.getUserProfile(userId);
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  },
  
  async resetPassword(email) {
    return await firebaseClient.resetPassword(email);
  },
  
  async logout() {
    return await firebaseClient.logout();
  }
};

// Default export that mimics base44 structure but uses Firebase
export const customBase44 = {
  entities: {
    SmartBin,
    Compartment,
    SingleBin,
    Alert,
    SubscriptionPlan,
  },
  auth: User,
  client: firebaseClient
};